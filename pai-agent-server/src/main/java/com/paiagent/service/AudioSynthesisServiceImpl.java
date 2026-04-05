package com.paiagent.service;

import com.alibaba.dashscope.aigc.multimodalconversation.AudioParameters;
import com.alibaba.dashscope.aigc.multimodalconversation.MultiModalConversation;
import com.alibaba.dashscope.aigc.multimodalconversation.MultiModalConversationParam;
import com.alibaba.dashscope.aigc.multimodalconversation.MultiModalConversationResult;
import com.alibaba.dashscope.exception.ApiException;
import com.alibaba.dashscope.exception.NoApiKeyException;
import com.alibaba.dashscope.exception.UploadFileException;
import com.alibaba.dashscope.utils.Constants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.sound.sampled.AudioFileFormat;
import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

/**
 * 音频合成服务实现 - 阿里百炼 qwen3-tts-flash
 *
 * 使用 DashScope SDK 2.21.9+ MultiModalConversation API 进行 TTS 合成
 * 音频文件上传到 MinIO 存储
 *
 * 支持模型:
 * - qwen3-tts-flash
 * - qwen3-tts-instruct-flash (支持指令控制)
 *
 * 音色选项:
 * - Cherry (女声-活力)
 * - Serena (女声-温柔)
 * - Amber (女声-自然)
 * - Anna (女声-甜美)
 * - Ethan (男声-沉稳)
 * - Adam (男声-磁性)
 * - Daniel (男声-成熟)
 * - Harry (男声-年轻)
 *
 * 超长文本处理:
 * - 自动分段合成（按句子分割，每段不超过500字符）
 * - 合并多段音频为单个文件
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AudioSynthesisServiceImpl implements AudioSynthesisService {

    private final MinioService minioService;

    // 文本最大长度（字符）
    private static final int MAX_TEXT_LENGTH = 500;

    // 设置 API 基础 URL
    static {
        Constants.baseHttpApiUrl = "https://dashscope.aliyuncs.com/api/v1";
    }

    @Override
    public String synthesize(String text, String voice, String languageType, String model, String apiKey) {
        SynthesisResult result = synthesizeWithTokens(text, voice, languageType, model, apiKey);
        return result != null ? result.getAudioUrl() : null;
    }

    @Override
    public SynthesisResult synthesizeWithTokens(String text, String voice, String languageType, String model, String apiKey) {
        log.info("调用阿里百炼 TTS 服务：textLength={}, voice={}, languageType={}, model={}",
                text != null ? text.length() : 0, voice, languageType, model);

        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("API Key 未配置，返回模拟音频 URL");
            return SynthesisResult.builder()
                    .audioUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3")
                    .inputTokens(0)
                    .outputTokens(0)
                    .build();
        }

        if (text == null || text.isEmpty()) {
            throw new RuntimeException("文本内容不能为空");
        }

        // 检查文本长度，超过限制则分段处理
        if (text.length() > MAX_TEXT_LENGTH) {
            log.info("文本长度 {} 超过限制 {}，启用分段合成", text.length(), MAX_TEXT_LENGTH);
            return synthesizeLongTextWithTokens(text, voice, languageType, model, apiKey);
        }

        return synthesizeSingleWithTokens(text, voice, languageType, model, apiKey);
    }

    /**
     * 合成单个文本片段
     */
    private SynthesisResult synthesizeSingleWithTokens(String text, String voice, String languageType, String model, String apiKey) {
        try {
            // 规范化模型和音色
            String normalizedModel = model != null && !model.isEmpty() ? model : "qwen3-tts-flash";
            AudioParameters.Voice normalizedVoice = parseVoice(voice);
            String normalizedLanguage = languageType != null && !languageType.isEmpty() ? languageType : "Auto";

            log.info("使用模型: {}, 音色: {}, 语言: {}", normalizedModel, normalizedVoice, normalizedLanguage);

            // 创建 MultiModalConversation 参数
            MultiModalConversationParam param = MultiModalConversationParam.builder()
                    .apiKey(apiKey)
                    .model(normalizedModel)
                    .text(text)
                    .voice(normalizedVoice)
                    .languageType(normalizedLanguage)
                    .build();

            // 调用 API
            MultiModalConversation conv = new MultiModalConversation();
            MultiModalConversationResult result = conv.call(param);

            // 获取音频 URL
            String dashscopeAudioUrl = result.getOutput().getAudio().getUrl();
            log.info("阿里百炼返回音频 URL: {}", dashscopeAudioUrl);

            // 尝试获取 token 使用量（TTS API 可能不返回，使用字符数估算）
            int inputTokens = 0;
            int outputTokens = 0;
            try {
                if (result.getUsage() != null) {
                    inputTokens = result.getUsage().getInputTokens();
                    outputTokens = result.getUsage().getOutputTokens();
                }
            } catch (Exception e) {
                log.debug("无法获取 token 使用量: {}", e.getMessage());
            }

            // 如果 API 未返回 token，使用文本字符数作为输入 token 估算
            if (inputTokens == 0 && text != null) {
                inputTokens = text.length();
            }

            // 下载音频数据
            byte[] audioData = downloadAudio(dashscopeAudioUrl);
            log.info("音频数据下载完成，大小: {} bytes", audioData.length);

            // 上传到 MinIO
            String minioUrl = minioService.uploadAudio(audioData, "audio/wav", ".wav");
            log.info("音频已上传到 MinIO: {}", minioUrl);

            return SynthesisResult.builder()
                    .audioUrl(minioUrl)
                    .inputTokens(inputTokens)
                    .outputTokens(outputTokens)
                    .build();

        } catch (ApiException e) {
            log.error("DashScope API 错误", e);
            throw new RuntimeException("DashScope API 错误：" + e.getMessage());
        } catch (NoApiKeyException e) {
            log.error("API Key 无效", e);
            throw new RuntimeException("API Key 无效：" + e.getMessage());
        } catch (UploadFileException e) {
            log.error("上传文件错误", e);
            throw new RuntimeException("上传文件错误：" + e.getMessage());
        } catch (Exception e) {
            log.error("调用阿里百炼 TTS API 失败", e);
            throw new RuntimeException("音频合成失败：" + e.getMessage(), e);
        }
    }

    /**
     * 分段合成超长文本
     */
    private SynthesisResult synthesizeLongTextWithTokens(String text, String voice, String languageType, String model, String apiKey) {
        // 1. 按句子分割文本
        List<String> segments = splitTextBySentences(text, MAX_TEXT_LENGTH);
        log.info("文本已分割为 {} 段", segments.size());

        // 2. 分别合成每段音频
        List<byte[]> audioSegments = new ArrayList<>();
        int totalInputTokens = 0;
        int totalOutputTokens = 0;

        for (int i = 0; i < segments.size(); i++) {
            String segment = segments.get(i);
            log.info("合成第 {}/{} 段，长度: {} 字符", i + 1, segments.size(), segment.length());

            try {
                SynthesisResult result = synthesizeSegmentWithTokens(segment, voice, languageType, model, apiKey);
                byte[] audioData = downloadAudio(result.getAudioUrl());
                audioSegments.add(audioData);
                totalInputTokens += result.getInputTokens();
                totalOutputTokens += result.getOutputTokens();
            } catch (Exception e) {
                log.error("第 {} 段合成失败: {}", i + 1, e.getMessage());
                // 继续合成其他段落
            }
        }

        if (audioSegments.isEmpty()) {
            throw new RuntimeException("所有段落合成失败");
        }

        // 3. 合并音频
        byte[] mergedAudio = mergeWavFiles(audioSegments);
        log.info("音频合并完成，总大小: {} bytes", mergedAudio.length);

        // 4. 上传到 MinIO
        String minioUrl = minioService.uploadAudio(mergedAudio, "audio/wav", ".wav");
        log.info("合并音频已上传到 MinIO: {}", minioUrl);

        return SynthesisResult.builder()
                .audioUrl(minioUrl)
                .inputTokens(totalInputTokens)
                .outputTokens(totalOutputTokens)
                .build();
    }

    /**
     * 合成单个片段（返回结果包含 token）
     */
    private SynthesisResult synthesizeSegmentWithTokens(String text, String voice, String languageType, String model, String apiKey) {
        try {
            String normalizedModel = model != null && !model.isEmpty() ? model : "qwen3-tts-flash";
            AudioParameters.Voice normalizedVoice = parseVoice(voice);
            String normalizedLanguage = languageType != null && !languageType.isEmpty() ? languageType : "Auto";

            MultiModalConversationParam param = MultiModalConversationParam.builder()
                    .apiKey(apiKey)
                    .model(normalizedModel)
                    .text(text)
                    .voice(normalizedVoice)
                    .languageType(normalizedLanguage)
                    .build();

            MultiModalConversation conv = new MultiModalConversation();
            MultiModalConversationResult result = conv.call(param);

            String dashscopeAudioUrl = result.getOutput().getAudio().getUrl();

            // 尝试获取 token 使用量（TTS API 可能不返回，使用字符数估算）
            int inputTokens = 0;
            int outputTokens = 0;
            try {
                if (result.getUsage() != null) {
                    inputTokens = result.getUsage().getInputTokens();
                    outputTokens = result.getUsage().getOutputTokens();
                }
            } catch (Exception e) {
                log.debug("无法获取 token 使用量: {}", e.getMessage());
            }

            // 如果 API 未返回 token，使用文本字符数作为输入 token 估算
            if (inputTokens == 0 && text != null) {
                inputTokens = text.length();
            }

            return SynthesisResult.builder()
                    .audioUrl(dashscopeAudioUrl)
                    .inputTokens(inputTokens)
                    .outputTokens(outputTokens)
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("段落合成失败: " + e.getMessage(), e);
        }
    }

    /**
     * 按句子分割文本（智能分割，不截断句子）
     */
    private List<String> splitTextBySentences(String text, int maxLength) {
        List<String> segments = new ArrayList<>();

        // 句子结束符
        String[] sentenceEndings = {"。", "！", "？", "；", ".", "!", "?", ";", "\n"};

        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + maxLength, text.length());

            // 如果不是最后一段，尝试在句子边界分割
            if (end < text.length()) {
                int lastSentenceEnd = -1;
                for (String ending : sentenceEndings) {
                    int pos = text.lastIndexOf(ending, end);
                    if (pos > lastSentenceEnd && pos >= start) {
                        lastSentenceEnd = pos + 1;
                    }
                }

                // 如果找到句子边界，在那里分割
                if (lastSentenceEnd > start) {
                    end = lastSentenceEnd;
                }
                // 否则尝试在空格或标点处分割
                else {
                    int lastSpace = text.lastIndexOf(" ", end);
                    if (lastSpace > start) {
                        end = lastSpace + 1;
                    }
                    // 如果都没有，尝试在逗号处分割
                    else {
                        int lastComma = Math.max(
                                text.lastIndexOf("，", end),
                                text.lastIndexOf(",", end)
                        );
                        if (lastComma > start) {
                            end = lastComma + 1;
                        }
                    }
                }
            }

            String segment = text.substring(start, end).trim();
            if (!segment.isEmpty()) {
                segments.add(segment);
            }
            start = end;
        }

        return segments;
    }

    /**
     * 合并多个 WAV 文件
     */
    private byte[] mergeWavFiles(List<byte[]> wavFiles) {
        try {
            if (wavFiles.size() == 1) {
                return wavFiles.get(0);
            }

            // 读取所有音频数据
            List<AudioInputStream> audioStreams = new ArrayList<>();
            AudioFormat format = null;
            long totalFrames = 0;

            for (byte[] wavData : wavFiles) {
                ByteArrayInputStream bais = new ByteArrayInputStream(wavData);
                AudioInputStream ais = AudioSystem.getAudioInputStream(bais);
                audioStreams.add(ais);
                if (format == null) {
                    format = ais.getFormat();
                }
                totalFrames += ais.getFrameLength();
            }

            // 创建合并后的音频流
            ByteArrayOutputStream out = new ByteArrayOutputStream();

            // 写入 WAV 头
            AudioInputStream firstStream = audioStreams.get(0);

            // 创建一个新的 AudioInputStream 来合并所有数据
            try (ByteArrayOutputStream audioData = new ByteArrayOutputStream()) {
                for (AudioInputStream ais : audioStreams) {
                    byte[] buffer = new byte[4096];
                    int bytesRead;
                    while ((bytesRead = ais.read(buffer)) != -1) {
                        audioData.write(buffer, 0, bytesRead);
                    }
                    ais.close();
                }

                byte[] rawData = audioData.toByteArray();

                // 使用 AudioSystem 写入标准 WAV 格式
                ByteArrayInputStream rawDataStream = new ByteArrayInputStream(rawData);
                AudioInputStream combinedStream = new AudioInputStream(
                        rawDataStream,
                        format,
                        rawData.length / format.getFrameSize()
                );

                AudioSystem.write(combinedStream, AudioFileFormat.Type.WAVE, out);
                combinedStream.close();
            }

            return out.toByteArray();

        } catch (Exception e) {
            log.error("合并音频失败", e);
            throw new RuntimeException("合并音频失败: " + e.getMessage());
        }
    }

    /**
     * 下载音频数据
     */
    private byte[] downloadAudio(String audioUrl) throws Exception {
        try (InputStream in = new URL(audioUrl).openStream();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = in.read(buffer)) != -1) {
                out.write(buffer, 0, bytesRead);
            }
            return out.toByteArray();
        }
    }

    /**
     * 解析音色名称
     */
    private AudioParameters.Voice parseVoice(String voice) {
        if (voice == null || voice.isEmpty()) {
            return AudioParameters.Voice.CHERRY;
        }
        switch (voice.toLowerCase()) {
            case "cherry":
                return AudioParameters.Voice.CHERRY;
            case "serena":
                return AudioParameters.Voice.SERENA;
            case "ethan":
                return AudioParameters.Voice.ETHAN;
            default:
                // 尝试解析为枚举值
                try {
                    return AudioParameters.Voice.valueOf(voice.toUpperCase());
                } catch (IllegalArgumentException e) {
                    log.warn("未知的音色: {}, 使用默认音色 CHERRY", voice);
                    return AudioParameters.Voice.CHERRY;
                }
        }
    }
}
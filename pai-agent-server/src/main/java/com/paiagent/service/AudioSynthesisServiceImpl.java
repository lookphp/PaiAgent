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

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URL;

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
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AudioSynthesisServiceImpl implements AudioSynthesisService {

    private final MinioService minioService;

    // 设置 API 基础 URL
    static {
        Constants.baseHttpApiUrl = "https://dashscope.aliyuncs.com/api/v1";
    }

    @Override
    public String synthesize(String text, String voice, String languageType, String model, String apiKey) {
        log.info("调用阿里百炼 TTS 服务：textLength={}, voice={}, languageType={}, model={}",
                text != null ? text.length() : 0, voice, languageType, model);

        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("API Key 未配置，返回模拟音频 URL");
            return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
        }

        if (text == null || text.isEmpty()) {
            throw new RuntimeException("文本内容不能为空");
        }

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

            // 下载音频数据
            byte[] audioData = downloadAudio(dashscopeAudioUrl);
            log.info("音频数据下载完成，大小: {} bytes", audioData.length);

            // 上传到 MinIO
            String minioUrl = minioService.uploadAudio(audioData, "audio/wav", ".wav");
            log.info("音频已上传到 MinIO: {}", minioUrl);

            return minioUrl;

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
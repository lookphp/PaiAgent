package com.paiagent.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * 音频合成服务实现
 * 目前为模拟实现，实际使用时需要接入真实的音频合成 API
 */
@Slf4j
@Service
public class AudioSynthesisServiceImpl implements AudioSynthesisService {

    @Value("${paiagent.ai.audio-synthesis.api-key:}")
    private String apiKey;

    @Override
    public String synthesize(String text, String voice) {
        log.info("调用音频合成服务：textLength={}, voice={}", text != null ? text.length() : 0, voice);

        // TODO: 实现真实的音频合成 API 调用
        // 目前返回一个模拟的音频 URL

        try {
            // 模拟 API 调用延迟
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // 返回一个测试音频 URL（实际使用时应该是合成后的音频文件 URL）
        return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    }
}

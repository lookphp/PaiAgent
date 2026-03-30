package com.paiagent.service;

/**
 * 音频合成服务接口
 */
public interface AudioSynthesisService {

    /**
     * 合成音频
     * @param text 文本内容
     * @param voice 音色
     * @return 音频 URL
     */
    String synthesize(String text, String voice);
}

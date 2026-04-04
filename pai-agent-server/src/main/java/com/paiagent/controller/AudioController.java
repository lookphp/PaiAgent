package com.paiagent.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 音频文件控制器
 * 用于播放 TTS 合成的音频文件
 */
@Slf4j
@RestController
@RequestMapping("/api/audio")
@CrossOrigin(origins = "*")
public class AudioController {

    // 音频文件存储目录
    private static final String AUDIO_DIR = "temp_audio";

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> getAudio(
            @PathVariable String filename,
            HttpServletRequest request) {

        log.info("请求音频文件: {}", filename);

        try {
            // 构建文件路径
            Path filePath = Paths.get(AUDIO_DIR, filename);
            Resource resource = new FileSystemResource(filePath);

            if (!resource.exists()) {
                log.warn("音频文件不存在: {}", filePath.toAbsolutePath());
                return ResponseEntity.notFound().build();
            }

            // 根据文件扩展名确定 Content-Type
            String contentType = "audio/wav";
            if (filename.endsWith(".mp3")) {
                contentType = "audio/mpeg";
            } else if (filename.endsWith(".wav")) {
                contentType = "audio/wav";
            } else if (filename.endsWith(".ogg")) {
                contentType = "audio/ogg";
            }

            // 设置响应头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentLength(resource.contentLength());
            headers.setCacheControl("public, max-age=3600");

            log.info("返回音频文件: {}, size: {} bytes", filename, resource.contentLength());

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);

        } catch (Exception e) {
            log.error("获取音频文件失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
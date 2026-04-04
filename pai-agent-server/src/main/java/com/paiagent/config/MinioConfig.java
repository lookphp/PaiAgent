package com.paiagent.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * MinIO 配置类
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "minio")
public class MinioConfig {

    /**
     * MinIO 服务地址
     */
    private String endpoint;

    /**
     * 访问密钥
     */
    private String accessKey;

    /**
     * 私密密钥
     */
    private String secretKey;

    /**
     * 存储桶名称
     */
    private String bucketName;

    /**
     * 公开访问 URL
     */
    private String publicUrl;
}
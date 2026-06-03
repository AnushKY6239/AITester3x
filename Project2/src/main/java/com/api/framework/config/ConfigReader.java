package com.api.framework.config;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class ConfigReader {
    private static ConfigReader instance;
    private Properties properties;

    private ConfigReader() {
        properties = new Properties();
        try (InputStream input = new FileInputStream("src/test/resources/config.properties")) {
            properties.load(input);
        } catch (IOException e) {
            throw new RuntimeException("Failed to load config.properties", e);
        }
    }

    public static ConfigReader getInstance() {
        if (instance == null) {
            instance = new ConfigReader();
        }
        return instance;
    }

    public String getBaseUrl() {
        return properties.getProperty("baseUrl");
    }

    public String getResourcePath() {
        return properties.getProperty("resourcePath");
    }

    public String getApiKey() {
        return properties.getProperty("apiKey");
    }

    public String getExtentReportsOutputDirectory() {
        return properties.getProperty("extentReportsOutputDirectory");
    }

    public String getExtentReportsFileName() {
        return properties.getProperty("extentReportsFileName");
    }

    public String getLogConfigurationFile() {
        return properties.getProperty("logConfigurationFile");
    }
}
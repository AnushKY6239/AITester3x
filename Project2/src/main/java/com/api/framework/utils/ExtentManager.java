package com.api.framework.utils;

import com.aventstack.extentreports.ExtentReports;
import com.aventstack.extentreports.reporter.ExtentSparkReporter;
import com.api.framework.config.ConfigReader;

public class ExtentManager {
    private static ExtentReports extent;

    public static ExtentReports createInstance() {
        ConfigReader config = ConfigReader.getInstance();
        String reportPath = config.getExtentReportsOutputDirectory() + "/" + config.getExtentReportsFileName();

        ExtentSparkReporter sparkReporter = new ExtentSparkReporter(reportPath);
        sparkReporter.config().setReportName("Google Maps Add API Automation Report");
        sparkReporter.config().setDocumentTitle("API Test Report");

        extent = new ExtentReports();
        extent.attachReporter(sparkReporter);
        extent.setSystemInfo("OS", System.getProperty("os.name"));
        extent.setSystemInfo("Java Version", System.getProperty("java.version"));
        extent.setSystemInfo("Tester", "API Automation Framework");

        return extent;
    }

    public static ExtentReports getInstance() {
        if (extent == null) {
            return createInstance();
        }
        return extent;
    }
}
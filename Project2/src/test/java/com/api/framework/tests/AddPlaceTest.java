package com.api.framework.tests;

import com.api.framework.api.GoogleMapsApi;
import com.api.framework.models.AddPlaceRequest;
import com.api.framework.models.AddPlaceResponse;
import com.api.framework.models.Location;
import com.api.framework.utils.ExtentManager;
import com.aventstack.extentreports.ExtentReports;
import com.aventstack.extentreports.ExtentTest;
import com.aventstack.extentreports.Status;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.testng.Assert;
import org.testng.ITestContext;
import org.testng.annotations.AfterTest;
import org.testng.annotations.BeforeTest;
import org.testng.annotations.Test;

public class AddPlaceTest {
    private static final Logger logger = LogManager.getLogger(AddPlaceTest.class);
    private GoogleMapsApi googleMapsApi;
    private ExtentReports extent;
    private ExtentTest test;

    @BeforeTest
    public void setup(ITestContext context) {
        logger.info("Setting up test environment");
        googleMapsApi = new GoogleMapsApi();
        extent = ExtentManager.getInstance();
        test = extent.createTest("Google Maps Add Place Test");
        context.setAttribute("extentTest", test);
        logger.info("Test setup completed");
    }

    @Test(description = "Verify that a new place can be added successfully using Google Maps Add API")
    public void testAddPlace() {
        logger.info("Starting test: testAddPlace");
        test.log(Status.INFO, "Starting test: testAddPlace");

        // Create request payload
        Location location = new Location(-38.383494, 33.427362);
        AddPlaceRequest request = new AddPlaceRequest(
                location,
                50,
                "Frontline house",
                "(+91) 983 893 3937",
                "29, side layout, cohen 09",
                java.util.Arrays.asList("shoe park", "shop"),
                "http://google.com",
                "French-IN"
        );

        logger.info("Created request payload: {}", request);
        test.log(Status.INFO, "Request payload created");

        // Execute API call
        AddPlaceResponse response = googleMapsApi.addPlace(request);

        logger.info("Received response: {}", response);
        test.log(Status.INFO, "API call executed successfully");

        // Assertions
        Assert.assertNotNull(response, "Response should not be null");
        Assert.assertEquals(response.getStatus(), "OK", "Status should be OK");
        Assert.assertNotNull(response.getPlace_id(), "Place ID should not be null or empty");
        Assert.assertEquals(response.getScope(), "APP", "Scope should be APP");
        Assert.assertNotNull(response.getReference(), "Reference should not be null or empty");
        Assert.assertNotNull(response.getId(), "ID should not be null or empty");

        logger.info("All assertions passed");
        test.log(Status.PASS, "All assertions passed");
        test.log(Status.INFO, "Response details: Status=" + response.getStatus() +
                ", Place ID=" + response.getPlace_id() +
                ", Scope=" + response.getScope());
    }

    @AfterTest
    public void tearDown(ITestContext context) {
        logger.info("Tearing down test environment");
        if (extent != null) {
            extent.flush();
        }
        logger.info("Test teardown completed");
    }
}
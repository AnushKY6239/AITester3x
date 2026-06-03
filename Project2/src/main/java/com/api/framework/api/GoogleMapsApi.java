package com.api.framework.api;

import com.api.framework.config.ConfigReader;
import com.api.framework.models.AddPlaceRequest;
import com.api.framework.models.AddPlaceResponse;
import io.restassured.response.Response;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import static io.restassured.RestAssured.given;

public class GoogleMapsApi {
    private static final Logger logger = LogManager.getLogger(GoogleMapsApi.class);
    private final ConfigReader config = ConfigReader.getInstance();

    /**
     * Sends POST request to add a new place using Google Maps API
     *
     * @param request AddPlaceRequest object containing place details
     * @return AddPlaceResponse object deserialized from API response
     */
    public AddPlaceResponse addPlace(AddPlaceRequest request) {
        logger.info("Sending POST request to add new place");
        logger.debug("Request payload: {}", request);

        Response response = given()
                .baseUri(config.getBaseUrl())
                .queryParam("key", config.getApiKey())
                .body(request)
                .when()
                .post(config.getResourcePath())
                .then()
                .extract()
                .response();

        logger.info("Received response with status code: {}", response.getStatusCode());
        logger.debug("Response body: {}", response.asPrettyString());

        // Validate status code
        if (response.getStatusCode() != 200) {
            throw new RuntimeException("API request failed with status code: " + response.getStatusCode());
        }

        AddPlaceResponse apiResponse = response.as(AddPlaceResponse.class);
        logger.info("Successfully deserialized response: {}", apiResponse);
        return apiResponse;
    }
}
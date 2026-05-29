package com.example;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

public class BlackjackSeleniumTest {
    private WebDriver driver;

    @BeforeMethod
    public void setUp() {
        // This will download and setup the chromedriver binary automatically
        WebDriverManager.chromedriver().setup();

        // Allow running headless via -Dheadless=true system property or Maven profile
        String headless = System.getProperty("headless", "false");
        ChromeOptions options = new ChromeOptions();
        if ("true".equalsIgnoreCase(headless)) {
            options.addArguments("--headless=new");
            options.addArguments("--disable-gpu");
            options.addArguments("--no-sandbox");
            options.addArguments("--window-size=1280,800");
        }

        driver = new ChromeDriver(options);
    }

    @AfterMethod
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    public void openHomePage_shouldShowBlackjackTitle() {
        driver.get("http://localhost:3000/");
        String title = driver.getTitle();
        // Adjust expectation to match your app's title
        Assert.assertTrue(title.toLowerCase().contains("blackjack"), "Title should contain 'Blackjack', was: " + title);
    }

    @Test
    public void openDashboard_and_close_shouldWork() {
        driver.get("http://localhost:3000/");
        WebDriverWait wait = new WebDriverWait(driver, java.time.Duration.ofSeconds(10));
        wait.until(ExpectedConditions.elementToBeClickable(org.openqa.selenium.By.id("btn-open-dashboard")));
        driver.findElement(org.openqa.selenium.By.id("btn-open-dashboard")).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(org.openqa.selenium.By.id("dashboard-modal")));
        Assert.assertTrue(driver.findElement(org.openqa.selenium.By.id("dashboard-modal")).isDisplayed());
        // close
        driver.findElement(org.openqa.selenium.By.id("dashboard-close")).click();
        wait.until(ExpectedConditions.invisibilityOfElementLocated(org.openqa.selenium.By.id("dashboard-modal")));
    }

    @Test
    public void startGame_hit_and_stand_flow() {
        driver.get("http://localhost:3000/");
        WebDriverWait wait = new WebDriverWait(driver, java.time.Duration.ofSeconds(10));

        // place bet
        wait.until(ExpectedConditions.elementToBeClickable(org.openqa.selenium.By.id("bet-input")));
        org.openqa.selenium.WebElement betInput = driver.findElement(org.openqa.selenium.By.id("bet-input"));
        betInput.clear();
        betInput.sendKeys("25");
        driver.findElement(org.openqa.selenium.By.id("btn-place-bet")).click();

        // wait for hit button
        wait.until(ExpectedConditions.elementToBeClickable(org.openqa.selenium.By.id("btn-hit")));
        driver.findElement(org.openqa.selenium.By.id("btn-hit")).click();

        // small pause to let UI update
        try { Thread.sleep(500); } catch (InterruptedException ignored) {}

        driver.findElement(org.openqa.selenium.By.id("btn-stand")).click();

        // wait for message board to show result
        wait.until(ExpectedConditions.visibilityOfElementLocated(org.openqa.selenium.By.id("message-board")));
        String message = driver.findElement(org.openqa.selenium.By.id("message-board")).getText();
        Assert.assertTrue(message.length() > 0, "Result message should be shown");
    }
}

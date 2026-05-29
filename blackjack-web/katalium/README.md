Katalium / Selenium / TestNG tests (Maven)

This folder contains a minimal Maven test module that uses Selenium + TestNG and WebDriverManager.
It provides a simple TestNG test that opens `http://localhost:3000` and checks the title.

How to run

Requirements:
- Java JDK 11+
- Maven
- Chrome browser installed (or modify the test to use another browser)

From project root run:

```bash
cd katalium
mvn test
```

Notes about Katalium:
- Katalium (the full framework) has additional helpers and reporting around Selenium/TestNG. If you want to use official Katalium artifacts, add the appropriate dependencies to `pom.xml` (see commented placeholder) and follow Katalium docs for configuration.
- The sample uses WebDriverManager so you don't need to manually download chromedriver.

Adjustments:
- If your app runs on a different port, change the URL in `src/test/java/com/example/BlackjackSeleniumTest.java`.
- To run headless, add ChromeOptions in the test constructor and set options (example available on WebDriver docs).

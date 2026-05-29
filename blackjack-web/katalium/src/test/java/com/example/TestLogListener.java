package com.example;

import org.testng.*;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;

public class TestLogListener implements ITestListener, ISuiteListener {
    private final File logFile = new File("katalium/logs/test-log.txt");

    private synchronized void write(String line) {
        try {
            logFile.getParentFile().mkdirs();
            try (BufferedWriter w = new BufferedWriter(new FileWriter(logFile, true))) {
                w.write(line);
                w.newLine();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private String now() {
        return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS").format(new Date());
    }

    @Override
    public void onStart(ISuite suite) {
        write(String.format("%s - SUITE START: %s", now(), suite.getName()));
    }

    @Override
    public void onFinish(ISuite suite) {
        write(String.format("%s - SUITE FINISH: %s", now(), suite.getName()));
    }

    @Override
    public void onTestStart(ITestResult result) {
        write(String.format("%s - TEST START: %s#%s", now(), result.getTestClass().getName(), result.getMethod().getMethodName()));
    }

    @Override
    public void onTestSuccess(ITestResult result) {
        write(String.format("%s - TEST SUCCESS: %s#%s (t=%dms)", now(), result.getTestClass().getName(), result.getMethod().getMethodName(), (result.getEndMillis() - result.getStartMillis())));
    }

    @Override
    public void onTestFailure(ITestResult result) {
        write(String.format("%s - TEST FAILURE: %s#%s", now(), result.getTestClass().getName(), result.getMethod().getMethodName()));
        if (result.getThrowable() != null) {
            write(String.format("%s - FAILURE: %s", now(), result.getThrowable().toString()));
        }
    }

    @Override
    public void onTestSkipped(ITestResult result) {
        write(String.format("%s - TEST SKIPPED: %s#%s", now(), result.getTestClass().getName(), result.getMethod().getMethodName()));
    }

    @Override
    public void onTestFailedButWithinSuccessPercentage(ITestResult result) {
        write(String.format("%s - TEST PARTIAL FAILURE: %s#%s", now(), result.getTestClass().getName(), result.getMethod().getMethodName()));
    }

    @Override
    public void onStart(ITestContext context) { }

    @Override
    public void onFinish(ITestContext context) { }
}


# 🧪 Unit Tests

This folder contains **unit tests** for the project. Unit tests are designed to verify the behavior of individual components or functions in isolation, without relying on external systems or dependencies.

## 📄 Structure

Each test file typically targets a specific module or function. The naming convention follows:

`test_<module_name>.py`

## ▶️ Running Unit Tests

To run all unit tests in this folder:

`pytest tests/unit/`

You can also run a specific test file.


## 🧩 Mocking & Fixtures

Many external dependencies and services have been mocked to ensure tests run reliably and independently. Shared fixtures and mocking configurations are defined in the `conftest.py` file located in the parent directory.
Refer to that file for details on how mocks are implemented and how to extend or override them for specific test cases.
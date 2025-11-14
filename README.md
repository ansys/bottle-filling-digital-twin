# bottle-filling-digital-twin Dev

Blueprint for developing vertical digital twin applications using Ansys Fluids simulations and NVIDIA Omniverse for bottle filling use case.

## Setting up pre-commit

You need to setup pre-commit on this repo befor contributing. Follow these steps to setup pre-commit on your local machine.

1. Add a python virtual environment at the root.

    ```bash
    python -m venv .venv
    ```

2. Activate the virtual environment.

    ```bash
    source .venv/bin/activate
    ```

    ```ps1
    .venv/Scripts/activate
    ```

3. Install pre-commit

    ```bash
    pip install pre-commit
    ```

4. Run pre-commit install

    ```bash
    pre-commit install
    ```

To run pre-commit checks:

```bash
pre-commit run --all-files
```


### Technical Support

For any technical support or to request a (trial) license, please contact us at [bottle-filling-app@ansys.com](mailto:bottle-filling-app@ansys.com)

When sending your email, please indicate the purpose in the subject line:

- **Subject: Contact for Support** - For technical assistance, bug reports, or general inquiries
- **Subject: Contact for License** - For Fluent license requests, trial license activation, or licensing issues

We aim to respond to all inquiries as soon as possible.

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

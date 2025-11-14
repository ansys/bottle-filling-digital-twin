# Cleaning
Remove all the UI components
Cleaned the extension folders
Cleaned the Python code and removed un-used functions

# Breaking Changes
## session.py
Removed _visualization -> use get_visualization() instead
Removed _solution -> method moved to the FluentSession class
FluentSession.connect now has no parameters (host, port, password are retrieved inside the function)
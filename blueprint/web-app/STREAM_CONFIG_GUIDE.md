# Stream Configuration Guide

The application now supports dynamic streaming configuration via the `stream.config.json` file in the `public` folder.

## Configuration Options

### 1. Local Streaming (`source: "local"`)

For local development or when the Omniverse Kit app is running locally:

```json
{
  "source": "local",
  "local": {
    "server": "127.0.0.1"
  }
}
```

- **server**: IP address of the local Omniverse Kit instance
- **port**: Automatically set to 54321
- **fps**: 60 FPS for optimal local performance
- **maxReconnects**: 5 (fewer retries for local)
- **authenticate**: false

### 2. GeForce Now Streaming (`source: "gfn"`)

For streaming via NVIDIA GeForce Now:

```json
{
  "source": "gfn",
  "gfn": {
    "catalogClientId": "your-catalog-client-id",
    "clientId": "your-client-id",
    "cmsId": 12345
  }
}
```

- **catalogClientId**: GFN catalog client identifier
- **clientId**: Application client identifier
- **cmsId**: Content management system ID
- **port**: 443 (HTTPS)
- **fps**: 30 FPS (optimized for cloud streaming)
- **maxReconnects**: 20
- **authenticate**: true

### 3. Remote Streaming Server (`source: "stream"`)

For streaming from a remote Omniverse streaming server:

```json
{
  "source": "stream",
  "stream": {
    "appServer": "my-streaming-server.example.com",
    "streamServer": "stream.example.com"
  }
}
```

- **appServer**: Omniverse application server hostname/IP (required)
- **streamServer**: Dedicated streaming server (optional, uses appServer if not specified)
- **port**: 54321
- **fps**: 30 FPS
- **maxReconnects**: 20
- **authenticate**: false

## Usage

1. Edit `public/stream.config.json` to set your desired configuration
2. Restart the development server: `pnpm dev`

## Troubleshooting

- **Configuration not loading**: Check browser network tab for 404 errors on stream.config.json
- **Source indicator not showing**: Verify the `source` field matches one of: "local", "gfn", "stream"
- **Connection issues**: Check console logs for detailed error messages from AppStream component

## Console Logging

The implementation includes extensive console logging for debugging:

- `SimulationPage: componentDidMount called` - Component is mounting
- `SimulationPage: Loaded stream configuration: {...}` - Config loaded successfully
- `AppStream: Initializing {type} stream to {server}:{port}` - Stream initializing
- `SimulationPage: About to render AppStream with props: {...}` - Props being passed to AppStream

Look for these logs in browser developer tools console.

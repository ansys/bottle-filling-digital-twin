# UI Customizations

## How to Add New Logo in Header

1. Add your new logo to the `/public/assets` folder
2. In the different Pages/ your app, add the reference of your logo:

a. For Single Logo (left side):

```html
  <Header
    appName="Bottle Filling Digital Twin"
    subtitle="Bottle Filling Omniverse"
    primaryLogo={{
        src: "/assets/cadfem-logo.png",
        alt: "Cadfem Logo",
        width: 40,
        height: 40
    }}
/>
```

b. Multiple Logos:

```html
<Header
  appName="Bottle Filling Digital Twin"
  primaryLogo={{
    src: "/assets/cadfem-logo.png",
    alt: "Cadfem Logo",
    position:"right"
  }}
  secondaryLogo={{
    src: "/assets/ansys-logo.png",
    alt: "Ansys Logo"
    position: "left"
  }}
  {/* Additional Logos */}
  additionalLogos={[
    {
      src: "/assets/nvidia-logo.png",
      alt: "NVIDIA Logo",
      position: "right"
    },
    {
      src: "/assets/azure-logo.png",
      alt: "Azure Logo",
      position: "right"
    }
  ]}
/>
```

c. Logo Only (no App name):

```html
<Header
  appName="Hidden App Name"
  showAppName={false}
  primaryLogo={{
    src: "/assets/company-logo.png",
    alt: "Company Logo",
    width: 150,
    height: 50
  }}
/>
```

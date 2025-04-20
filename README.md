# Civitai Fullscreen Slideshow

A web application that fetches images and videos from the Civitai API and displays them as a fullscreen slideshow that auto-scrolls every 5 seconds.

## Features

- Fullscreen slideshow interface
- Auto-scrolls every 5 seconds
- Supports both images and videos from Civitai
- Responsive design that works across different screen sizes

## Getting Started

### Prerequisites

- Node.js (v14 or later recommended)
- npm or yarn

### Installation

1. Clone this repository
```bash
git clone https://github.com/yourusername/civitai-slideshow.git
cd civitai-slideshow
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the development server
```bash
npm start
# or
yarn start
```

4. Open your browser and navigate to `http://localhost:3000`

## How It Works

The application uses:

- React for the UI components
- axios for API requests to Civitai
- react-slick for the slideshow functionality
- styled-components for styling

The slideshow fetches media from the Civitai API and displays them in a fullscreen carousel that automatically transitions every 5 seconds.

## Configuration

You can adjust the slideshow settings in the `Slideshow.tsx` component:

- Change `autoplaySpeed` (in milliseconds) to adjust the scroll timing
- Modify the `limit` parameter in `fetchCivitaiMedia` to change the number of media items to fetch
- Set the `nsfw` parameter to filter content

## License

MIT

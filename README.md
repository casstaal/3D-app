# Hand Tracking CAD

A web-based 3D drawing application that allows users to create and manipulate objects using hand gestures.

The application uses the webcam together with MediaPipe Hand Landmarker to recognize hand gestures. These gestures can be used to draw shapes, select objects, resize them and navigate around the 3D environment.

Created objects can be extruded from 2D shapes into 3D objects and exported as STL files.

## Features

- Real-time hand tracking using a webcam
- Drawing using hand gestures
- Free drawing
- Automatic shape detection
- Object selection
- Object resizing using two hands
- 3D camera rotation using hand gestures
- Extruding 2D shapes into 3D objects
- Exporting 3D objects to STL
- Undo and clear functionality

## Hand Gestures

The application uses different hand gestures for different interactions.

| Gesture                   | Action                     |
| ------------------------- | -------------------------- |
| ☝️ Index finger           | Draw                       |
| 🖕 Middle finger          | Select an object           |
| ✊ Fist                   | Rotate the 3D view         |
| ☝️ + ☝️ Two index fingers | Resize the selected object |

When no supported gesture is detected, the application remains in `idle` mode.

## Drawing Modes

### Free Draw

Free Draw stores the movement of the index finger as a series of points, allowing the user to draw freely.

### Shape Detect

Shape Detect analyses the drawn stroke and attempts to convert it into a geometric shape.

Currently supported shapes include:

- Line
- Rectangle
- Circle

## 3D Objects

Shapes are initially created on a local 2D drawing plane.

Each point still uses 3D coordinates:

```ts
type Point3D = {
  x: number;
  y: number;
  z: number;
};
```

While drawing, the local `z` coordinate is initially `0`.

For example, a rectangle contains:

```ts
{
  (x, y, width, height, depth);
}
```

A newly drawn rectangle starts with:

```text
depth = 0
```

When the object is extruded, its depth becomes greater than zero and the rectangle is rendered as a 3D box.

Each sketch also stores a position and quaternion. This allows the local X, Y and Z axes of the sketch to be positioned and rotated correctly inside the 3D world.

## Object Resizing

Objects can be resized using two index fingers.

The application compares the orientation of the selected object's local axes with the current camera orientation.

This means resizing depends on the current view.

For example:

```text
Front view:
horizontal movement → width
vertical movement   → height

Side view:
horizontal movement → depth
vertical movement   → height
```

This makes it possible to manipulate all three dimensions of an object while navigating around it.

## STL Export

Extruded objects can be exported as an STL file.

The application uses Three.js `STLExporter` to convert supported 3D geometry into a binary STL file.

Currently exportable objects include:

- Extruded rectangles
- Extruded circles

Flat sketches and free-drawn lines are not exported because they do not have a 3D volume.

## Technologies

The application is built with:

- React
- TypeScript
- Vite
- Three.js
- React Three Fiber
- MediaPipe Tasks Vision
- Tailwind CSS
- Lucide React

### MediaPipe

MediaPipe Hand Landmarker is responsible for detecting hand landmarks from the webcam feed.

The detected landmarks are interpreted by the application and converted into interaction modes such as:

```text
idle
draw
select
rotate
resize
```

### Three.js / React Three Fiber

Three.js is used for the 3D environment.

React Three Fiber provides the React integration for Three.js and is used for:

- Rendering sketches
- Rendering 3D geometry
- Raycasting
- Camera movement
- Object transformations
- STL export

## Project Structure

The main project structure is:

```text
src/
├── components/
│   ├── CameraViewport.tsx
│   ├── SceneViewport.tsx
│   │
│   └── scene/
│       ├── ActiveSketch.tsx
│       ├── SavedSketch.tsx
│       ├── ShapeRenderer.tsx
│       ├── SketchLine.tsx
│       ├── HandSelection.tsx
│       ├── HandResize.tsx
│       └── HandOrbit.tsx
│
├── features/
│   ├── handTracking/
│   │   ├── gestureMapper.ts
│   │   └── types.ts
│   │
│   └── modeling/
│       ├── sketchTypes.ts
│       ├── sketchStore.ts
│       ├── shapeBuilder.ts
│       └── stlExporter.ts
│
└── hooks/
    ├── useCamera.ts
    └── useHandTracking.ts
```

### CameraViewport

`CameraViewport` is the main user interface. It combines the webcam, MediaPipe overlay, 3D viewport and application controls.

### SceneViewport

`SceneViewport` contains the React Three Fiber canvas and coordinates the 3D interaction components.

### ActiveSketch

Handles the sketch that is currently being drawn.

### SavedSketch

Renders sketches that have been completed.

### HandSelection

Uses Three.js raycasting to determine which object the user is pointing at during the select gesture.

### HandResize

Resizes the selected object based on the distance between the two detected index fingers and the current camera orientation.

### HandOrbit

Controls the Three.js camera using the rotate gesture.

## Installation

Clone the repository:

```bash
git clone <repository-url>
```

Navigate to the project:

```bash
cd <project-folder>
```

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the URL shown by Vite in your browser.

## Camera Permission

The application requires access to the webcam for hand tracking.

When opening the application, allow camera access when requested by the browser.

A modern browser with WebGL and webcam support is recommended.

## Usage

1. Start the camera.
2. Select `Free Draw` or `Shape Detect`.
3. Use your index finger to draw.
4. Click `Finish Sketch` when the sketch is complete.
5. Use the select gesture to select an object.
6. Use two index fingers to resize the selected object.
7. Use the fist gesture to rotate around the object.
8. Select a supported shape and click `Extrude` to give it depth.
9. Export the resulting 3D model using `Export STL`.

## Current Limitations

The application is currently a prototype and does not yet provide the full functionality of traditional CAD software.

Current limitations include:

- Shape detection is based on heuristics.
- Only a limited number of geometric shapes are recognized.
- Free-drawn lines cannot currently be extruded.
- STL export only supports shapes with 3D volume.
- Gesture recognition can be affected by lighting and camera visibility.
- Complex CAD operations such as boolean operations are not yet supported.

## Future Improvements

Possible future improvements include:

- More shape detection options
- Improved gesture recognition
- Moving objects in 3D
- Rotation of individual objects
- More extrusion controls
- Object snapping
- Grid support
- Multiple sketch planes
- Additional CAD operations
- Improved STL export
- Saving and loading projects

## License

This project was developed as an educational project.

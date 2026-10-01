import CameraViewport from "./components/CameraViewport";

export default function HandCadUiStarter() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <div className="absolute inset-0">
        <CameraViewport />
      </div>
    </div>
  );
}

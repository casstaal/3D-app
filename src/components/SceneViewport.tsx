import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export default function SceneViewport() {
  return (
    <Canvas
      gl={{
        alpha: true,
        antialias: true,
      }}
      camera={{
        position: [0, 2, 5],
        fov: 45,
      }}
      style={{
        width: "100%",
        height: "100%",
        background: "transparent",
      }}
    >
      <ambientLight intensity={1.5} />

      <directionalLight position={[5, 5, 5]} intensity={2} />

      <mesh>
        <boxGeometry args={[2, 2, 2]} />

        <meshStandardMaterial color="#22c55e" transparent opacity={0.75} />
      </mesh>

      <OrbitControls />
    </Canvas>
  );
}

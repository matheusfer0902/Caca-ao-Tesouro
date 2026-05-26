export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 14, 6]} intensity={1.1} castShadow />
      <directionalLight position={[-6, 8, -4]} intensity={0.35} color="#8ed2f8" />
      <fog attach="fog" args={['#06283d', 18, 45]} />
    </>
  );
}

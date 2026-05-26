export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.75} color="#b8e8f4" />
      <hemisphereLight args={['#8ed2f8', '#06283d', 0.6]} />
      <directionalLight position={[8, 16, 10]} intensity={1.4} color="#fff6c3" castShadow />
      <directionalLight position={[-10, 8, -8]} intensity={0.6} color="#00ffca" />
    </>
  );
}

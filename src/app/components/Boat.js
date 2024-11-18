"use client";
import * as THREE from "three";
import { useEffect, useRef } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const Boat = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
      );
      camera.position.set(0, 5, 10);
      camera.layers.enableAll();

      // Create a renderer
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      containerRef.current.appendChild(renderer.domElement);

      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      // Add axes helper
      const axesHelper = new THREE.AxesHelper(5);
      scene.add(axesHelper);

      // Load the Blender model
      const loader = new GLTFLoader();
      loader.load(
        "/models/boat_demo.glb",
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            if (child.isMesh) {
              child.layers.set(1);
            }
          });
          scene.add(model);

          // Create spheres and add them to the boat
          const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
          const greenMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x000000,
          });
          const redMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0x000000,
          });

          const sphere1 = new THREE.Mesh(sphereGeometry, greenMaterial);
          sphere1.scale.set(0.55, 0.55, 0.55);
          sphere1.position.set(-0.3, -0.4, -0.6);
          sphere1.layers.set(2);

          const sphere2 = new THREE.Mesh(sphereGeometry, redMaterial);
          sphere2.scale.set(0.5, 0.5, 0.5);
          sphere2.position.set(2, -0.4, 0.4);
          sphere2.layers.set(2);

          scene.add(sphere1, sphere2);

          // Raycaster for detecting mouse interactions
          const raycaster = new THREE.Raycaster();
          raycaster.layers.set(2); // Only check layer 2
          const mouse = new THREE.Vector2();
          let intersectedObject = null;

          const onMouseMove = (event) => {
            // Calculate mouse position in normalized device coordinates (NDC, more responsive)
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects([sphere1, sphere2]);

            if (intersects.length > 0) {
              if (intersectedObject !== intersects[0].object) {
                if (intersectedObject) {
                  intersectedObject.material.emissive.set(
                    intersectedObject.userData.originalEmissive
                  );
                }
                intersectedObject = intersects[0].object;
                intersectedObject.userData.originalEmissive =
                  intersectedObject.material.emissive.getHex();
                intersectedObject.material.emissive.set(0xffff00);
              }
            } else {
              if (intersectedObject) {
                intersectedObject.material.emissive.set(
                  intersectedObject.userData.originalEmissive
                );
                intersectedObject = null;
              }
            }
          };

          window.addEventListener("mousemove", onMouseMove, false);

          // Cleanup event listeners on component unmount
          return () => {
            window.removeEventListener("mousemove", onMouseMove, false);
          };
        },
        undefined,
        (error) => {
          console.error(error);
        }
      );

      // Add OrbitControls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.screenSpacePanning = false;
      controls.minDistance = 1;
      controls.maxDistance = 30;

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // Handle window resize
      const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onWindowResize, false);

      // Cleanup on component unmount
      return () => {
        window.removeEventListener("resize", onWindowResize, false);
        containerRef.current.removeChild(renderer.domElement);
      };
    }
  }, []);

  return <div ref={containerRef} />;
};

export default Boat;

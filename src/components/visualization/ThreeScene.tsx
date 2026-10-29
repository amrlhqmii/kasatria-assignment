import { useEffect, useImperativeHandle, useRef } from "react";
import type { Ref } from "react";
import * as THREE from "three";
import { CSS3DRenderer, CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Easing, Group, Tween } from "@tweenjs/tween.js";
import type { Person } from "../../types/person";
import { createLayoutTargets } from "../../lib/sceneLayouts";
import type { Layout } from "../../lib/sceneLayouts";
import { createPersonTile } from "./PersonTile";

export interface SceneControls {
  zoom: (factor: number) => void;
  reset: () => void;
}

interface ThreeSceneProps {
  people: Person[];
  layout: Layout;
  ref?: Ref<SceneControls>;
}

export default function ThreeScene({ people, layout, ref }: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<(SceneControls & { setLayout: (layout: Layout) => void }) | null>(null);

  useImperativeHandle(ref, () => ({
    zoom: (factor) => actionsRef.current?.zoom(factor),
    reset: () => actionsRef.current?.reset(),
  }), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 50_000);
    const renderer = new CSS3DRenderer();
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    const transitions = new Group();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      controls.enableDamping = !reducedMotion.matches;
      if (reducedMotion.matches) transitions.getAll().forEach((tween) => tween.end());
    };
    updateMotion();
    reducedMotion.addEventListener("change", updateMotion);
    controls.dampingFactor = 0.08;
    controls.minDistance = 500;
    controls.listenToKeyEvents(container);

    const targets = createLayoutTargets(people.length);
    let currentTargets = targets.Table;
    const objects: CSS3DObject[] = people.map((person, index) => {
      const object = createPersonTile(person);
      object.position.copy(targets.Table[index].position);
      scene.add(object);
      return object;
    });

    const fitView = () => {
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      const bounds = new THREE.Box3().setFromPoints(currentTargets.map((target) => target.position));
      bounds.expandByVector(new THREE.Vector3(110, 130, 110));
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const distance = Math.max(size.y, size.x / camera.aspect) / (2 * Math.tan(halfFov)) * 1.1 + size.z / 2;
      controls.maxDistance = Math.max(8500, distance * 2);
      camera.far = controls.maxDistance + 5000;
      camera.updateProjectionMatrix();
      controls.target.copy(center);
      camera.position.set(center.x, center.y, center.z + distance);
      controls.saveState();
      controls.reset();
    };

    actionsRef.current = {
      zoom: (factor) => {
        const offset = camera.position.clone().sub(controls.target);
        const distance = offset.length();
        const nextDistance = THREE.MathUtils.clamp(distance * factor, controls.minDistance, controls.maxDistance);
        camera.position.copy(controls.target).add(offset.multiplyScalar(nextDistance / distance));
        controls.update();
      },
      reset: fitView,
      setLayout: (nextLayout) => {
        transitions.removeAll();
        currentTargets = targets[nextLayout];
        objects.forEach((object, index) => {
          const target = currentTargets[index];
          if (reducedMotion.matches) {
            object.position.copy(target.position);
            object.quaternion.copy(target.quaternion);
            return;
          }
          const position = object.position.clone();
          const quaternion = object.quaternion.clone();
          const tween = new Tween({ progress: 0 }).to({ progress: 1 }, 1000)
            .easing(Easing.Cubic.InOut)
            .onUpdate(({ progress }) => {
              object.position.lerpVectors(position, target.position, progress);
              object.quaternion.slerpQuaternions(quaternion, target.quaternion, progress);
            });
          transitions.add(tween);
          tween.start();
        });
        fitView();
      },
    };

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      renderer.setSize(width, height);
      fitView();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let animationFrameId = 0;
    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);
      transitions.update(time);
      controls.update();
      renderer.render(scene, camera);
    };
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      actionsRef.current = null;
      cancelAnimationFrame(animationFrameId);
      transitions.removeAll();
      resizeObserver.disconnect();
      reducedMotion.removeEventListener("change", updateMotion);
      controls.dispose();
      objects.forEach((object) => {
        scene.remove(object);
        object.element.remove();
      });
      renderer.domElement.remove();
    };
  }, [people]);

  useEffect(() => {
    actionsRef.current?.setLayout(layout);
  }, [layout, people]);

  return (
    <div
      ref={containerRef}
      className="three-scene"
      tabIndex={0}
      role="region"
      aria-label="Interactive 3D visualization of people. Arrow keys pan, plus and minus zoom, Home resets the view."
      onKeyDown={(event) => {
        if (event.key === "+" || event.key === "=") {
          event.preventDefault();
          actionsRef.current?.zoom(0.8);
        } else if (event.key === "-") {
          event.preventDefault();
          actionsRef.current?.zoom(1.25);
        } else if (event.key === "Home") {
          event.preventDefault();
          actionsRef.current?.reset();
        }
      }}
    />
  );
}

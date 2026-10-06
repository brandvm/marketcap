// One shared GSAP instance with ScrollTrigger registered, so every module
// gets the same ticker that Lenis drives.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export { gsap, ScrollTrigger };

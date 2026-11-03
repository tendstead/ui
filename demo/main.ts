import { mount } from 'svelte';
import Demo from './Demo.svelte';
import '@tendstead/ui/theme.css';
import './demo.css';
mount(Demo, { target:document.getElementById('app')! });

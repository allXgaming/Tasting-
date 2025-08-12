export function setupJoystick(containerId, knobId, onMove, onEnd) { 
    const container = document.getElementById(containerId);
    if(!container) return {isActive: () => false};
    const knob = document.getElementById(knobId);
    let isActive = false; let touchId = null;
    const maxDist = container.offsetWidth / 2 - knob.offsetWidth / 4;
    const handleStart = (e) => { const touch = e.type === 'touchstart' ? e.changedTouches[0] : e; if (isActive) return; isActive = true; touchId = touch.identifier; };
    const handleEnd = (e) => { if (!isActive) return; const touch = e.type === 'touchend' ? Array.from(e.changedTouches).find(t => t.identifier === touchId) : e; if (!touch && e.type.includes('touch')) return; isActive = false; touchId = null; knob.style.transform = `translate(0px, 0px)`; onEnd(); };
    const handleMove = (e) => { if (!isActive) return; e.preventDefault(); const touch = e.type === 'touchmove' ? Array.from(e.touches).find(t => t.identifier === touchId) : e; if (!touch) return; const rect = container.getBoundingClientRect(); const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2; let dx = touch.clientX - centerX; let dy = touch.clientY - centerY; const distance = Math.hypot(dx, dy); const angle = Math.atan2(dy, dx); let knobX = dx, knobY = dy; if (distance > maxDist) { knobX = Math.cos(angle) * maxDist; knobY = Math.sin(angle) * maxDist; } knob.style.transform = `translate(${knobX}px, ${knobY}px)`; onMove(angle, distance / maxDist); };
    container.addEventListener('mousedown', handleStart); window.addEventListener('mousemove', handleMove); window.addEventListener('mouseup', handleEnd);
    container.addEventListener('touchstart', handleStart, { passive: false }); window.addEventListener('touchmove', handleMove, { passive: false }); window.addEventListener('touchend', handleEnd);
    return { isActive: () => isActive }; 
}
// Keyboard + mouse input for Midnight Vault. WASD / arrows move, click
// sets a walk target, Q drops a smoke bomb, E fires the EMP, M mutes,
// Esc pauses, Enter confirms menus.

export function createInput(canvas, hooks) {
  const keys = new Set();
  const state = { keys, moveTarget: null };

  function keyName(e) {
    return e.key.toLowerCase();
  }

  window.addEventListener('keydown', (e) => {
    const k = keyName(e);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
      e.preventDefault();
    }
    if (k === 'q') { hooks.onSmoke?.(); return; }
    if (k === 'e') { hooks.onEmp?.(); return; }
    if (k === 'm') { hooks.onMute?.(); return; }
    if (k === 'escape') { hooks.onPause?.(); return; }
    if (k === 'enter') { hooks.onConfirm?.(); return; }
    keys.add(k);
  });
  window.addEventListener('keyup', (e) => keys.delete(keyName(e)));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    state.moveTarget = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
    hooks.onClickMove?.(state.moveTarget);
  });

  return state;
}

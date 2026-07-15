/** Svelte action — chama `callback` quando o elemento entra na viewport (rolagem infinita). */
export function onVisible(node: HTMLElement, callback: () => void) {
	const observer = new IntersectionObserver((entries) => {
		if (entries[0]?.isIntersecting) callback();
	});
	observer.observe(node);
	return {
		destroy() {
			observer.disconnect();
		}
	};
}

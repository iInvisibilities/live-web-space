<script lang="ts">
	import { goto } from '$app/navigation';
	import PlusSign from '$lib/svg_paths/PlusSign.svelte';

	let loader: HTMLElement;
	let main_text: string;

	async function createNewSessionForOurUserYayyy() {
		loader.classList.remove('opacity-0', '-translate-x-10');
		const create_session_request = await fetch('/api/session_manager/create');
		const created_session = await create_session_request.json();
		const session_id = created_session['new_session_id'];
		if (created_session == undefined || created_session['new_session_id'] == undefined) {
			main_text = "Couldn't create new session!";
			return;
		}
		await goto('/session/' + session_id);
	}
</script>

<div class="hdvh grid h-dvh w-dvw items-center justify-center">
	<div class="flex w-full items-center justify-between gap-5">
		<button
			on:click={createNewSessionForOurUserYayyy}
			class="roboto-400 flex select-none items-center justify-between border-2 border-[#E17564] bg-[#09122C] px-2 font-sans text-lg text-[#E17564]
     transition-all duration-150 ease-out hover:scale-[115%] hover:bg-[#E17564] hover:text-[#09122C] active:scale-110"
			><svg width="48px" height="48px" viewBox="0 0 24 24">
				<path d="M12 6V18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
				<path d="M6 12H18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
			</svg><span bind:textContent={main_text} contenteditable="false">web space session</span
			></button
		>

		<div bind:this={loader} class="-translate-x-10 text-[#E17564] opacity-0 transition-all">
			<svg
				class="w-12 animate-spin"
				style="animation-direction: reverse;"
				viewBox="0 0 503.467 503.467"
			>
				<PlusSign fill="currentColor" />
			</svg>
		</div>
	</div>
</div>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
	import type { UpdateViewEvent } from '$lib/shared_types';
	import Explosion from '$lib/svg_paths/Explosion.svelte';
	import CopyIcn from '$lib/svg_paths/CopyIcn.svelte';
	import InsertElIcn from '$lib/svg_paths/InsertElIcn.svelte';

	let copy_tick: SVGPathElement;
	let { data }: PageProps = $props();

	let html_to_be_shared: HTMLTextAreaElement | undefined = $state();
	let html_to_be_shared_dial: HTMLDivElement | undefined = $state();

	const parser = new DOMParser();

	let ws: WebSocket;

	const registerMoveHandler = (element: HTMLElement, main_node: HTMLElement) => {
		element.addEventListener('click', (e) => {
			if (e.ctrlKey) {
				broadcastMoveEvent(element.id);
				element.remove();
			}
		});

		element.addEventListener('mousemove', (e) => {
			if (e.ctrlKey) element.style.cursor = 'not-allowed';
			else element.style.cursor = 'default';
		});

		element.addEventListener('dblclick', (e) => {
			if (element.id == '') return;

			element.classList.add('grabbing');
			const abort_cont = new AbortController();

			const move_element = (e: MouseEvent) => {
				const [x, y] = [e.clientX, e.clientY];
				element.style.left = x + 'px';
				element.style.top = y + 'px';
			};

			main_node.addEventListener('mousemove', move_element, { signal: abort_cont.signal });
			main_node.addEventListener('click', (e) => {
				abort_cont.abort();

				if (!e.ctrlKey) {
					element.classList.remove('grabbing');
					broadcastMoveEvent(element);
				}
			});
		});
	};

	const broadcastMoveEvent = (element: HTMLElement | string) => {
		let move_event: UpdateViewEvent;
		if (element instanceof HTMLElement) {
			move_event = {
				type: 'ELEMENT_MOVED',
				html: undefined,
				coordinates: [
					{
						id: element.id,
						x: element.offsetLeft,
						y: element.offsetTop
					}
				]
			};
		} else {
			move_event = {
				type: 'ELEMENT_REMOVED',
				html: undefined,
				coordinates: [
					{
						id: element,
						x: 0,
						y: 0
					}
				]
			};
		}

		ws.send(JSON.stringify({ interaction_data: move_event }));
	};

	onMount(async () => {
		copy_tick.style.display = 'none';

		if (data.can_join) {
			const url_operation = new URL(window.location.origin);
			url_operation.port = '3000';
			url_operation.pathname = '/' + data.session_id;
			url_operation.protocol = 'ws:';

			ws = new WebSocket(url_operation);
			ws.onmessage = (message_event) => {
				const message_obj = JSON.parse(message_event.data.toString());
				switch (message_obj['event_type']) {
					case 'NOTIFICATION':
						// MAKE IT BETTER AND MORE STYLED WAY OF SHOWING THIS
						alert(message_obj['notification_message']);
						break;
					case 'UPDATE_VIEW':
						const view_update_meta: UpdateViewEvent = message_obj['view_update_meta'];
						if (view_update_meta == undefined) return;
						if (view_update_meta['type'] == undefined) return;

						switch (view_update_meta['type']) {
							case 'ELEMENT_ADDED':
								if (view_update_meta['html'] == undefined) return;
								interpretHtmlContentIntoMyDOM(view_update_meta['html']);
								break;
							case 'ELEMENT_REMOVED':
								if (view_update_meta['coordinates'] == undefined) return;
								const removed_element_id = view_update_meta['coordinates'][0]['id'];
								const element_to_remove = document.getElementById(removed_element_id);
								if (element_to_remove == null) return;
								element_to_remove.remove();
								break;
							case 'ELEMENT_MOVED':
								if (view_update_meta['coordinates'] == undefined) return;
								view_update_meta['coordinates'].forEach((coordinate) => {
									const element_to_move = document.getElementById(coordinate['id']);
									if (element_to_move == null) return;
									const [x, y] = [coordinate['x'], coordinate['y']];
									element_to_move.style.left = x + 'px';
									element_to_move.style.top = y + 'px';
								});
								break;
							default:
								break;
						}
						break;
					default:
						break;
				}
			};
		} else goto('/');
	});

	const showElementToBeSharedDialog = () => {
		if (html_to_be_shared_dial == undefined) return;
		html_to_be_shared_dial.style.display = 'grid';
	};

	const hideElementToBeSharedDialog = () => {
		if (html_to_be_shared_dial == undefined) return;
		html_to_be_shared_dial.style.display = 'none';
	};

	const shareHtmlToBeShared = async () => {
		if (html_to_be_shared == undefined) return;
		const html_content: string = html_to_be_shared.value;
		html_to_be_shared.value = '';
		hideElementToBeSharedDialog();

		const serialize_and_share_my_html = await fetch('/api/html_parser', {
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ html_content_to_be_serialized: html_content })
		});
		if (!serialize_and_share_my_html.ok) {
			alert('Error parsing your HTML content!');
			return;
		}

		const serialize_and_share_my_html_json = await serialize_and_share_my_html.json();
		const serialized_html: string | undefined = serialize_and_share_my_html_json['serialized_html'];
		if (serialized_html == undefined) {
			alert('Error parsing your HTML content!');
			return;
		}

		interpretHtmlContentIntoMyDOM(serialized_html);
	};

	const interpretHtmlContentIntoMyDOM = (html_content: string) => {
		const parsed_html = parser.parseFromString(html_content, 'text/html');
		const main = document.querySelector('main');
		const body = parsed_html.body;
		if (body == null || main == null) return;

		while (body.firstChild) {
			if (data.is_admin) registerMoveHandler(body.firstChild as HTMLElement, main);
			main.appendChild(body.firstChild);
		}
	};

	const insertElementToBeShared = (e: MouseEvent) => {
		if (
			html_to_be_shared == undefined ||
			e.currentTarget == undefined ||
			!(e.currentTarget instanceof HTMLButtonElement)
		)
			return;

		const element_name: string | null = e.currentTarget.getAttribute('data-tag');
		if (element_name == null) return;

		const is_self_closing: boolean = e.currentTarget.hasAttribute('data-self-closing');

		const element_name_open: string = '<' + element_name + (is_self_closing ? ' ' : '>');
		let element_name_close: string;
		if (is_self_closing) {
			element_name_close = ' />';
		} else element_name_close = '</' + element_name + '>';

		html_to_be_shared.setRangeText(
			element_name_open,
			html_to_be_shared.selectionStart,
			html_to_be_shared.selectionStart + element_name_open.length,
			'end'
		);
		html_to_be_shared.setRangeText(
			element_name_close,
			html_to_be_shared.selectionStart,
			html_to_be_shared.selectionStart + element_name_open.length + element_name_close.length,
			'start'
		);
		html_to_be_shared.focus();
	};

	const destroyOwnSession = async () => {
		const explode_request = await fetch('/api/session_manager/explode', { method: 'post' });
		if (explode_request.ok) {
			goto('/');
		}
	};
</script>

<nav class="flex w-dvw items-center p-1">
	{#if data.is_admin}
		<button
			onclick={showElementToBeSharedDialog}
			class="ml-auto mr-auto flex items-center gap-2 bg-green-800 p-1 text-white transition-all hover:shadow-[10px_0_0_#166534,-10px_0_0_#166534]"
			><svg width="24px" height="24px" viewBox="0 0 24 24" fill="none">
				<InsertElIcn stroke="currentColor"></InsertElIcn>
			</svg>add element</button
		>
		<div
			bind:this={html_to_be_shared_dial}
			class="absolute inset-0 z-10 m-auto hidden h-fit w-max items-center shadow-md"
		>
			<div class="flex h-[100px] min-h-max items-start justify-between border-2 bg-gray-200">
				<textarea
					bind:this={html_to_be_shared}
					class="h-full w-full bg-gray-200 outline-none"
					name=""
					placeholder="HTML Content to be shared across the web session"
				></textarea>
				<button
					onclick={hideElementToBeSharedDialog}
					class="bg-gray-200 text-[#872341]"
					aria-label="close"
					><svg
						width="24px"
						height="24px"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M6 18L18 6M6 6l12 12"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg></button
				>
			</div>
			<div
				class="flex justify-center text-xl text-white [&>button:hover]:skew-y-3 [&>button:hover]:scale-110 [&>button]:bg-[#276781] [&>button]:px-1 [&>button]:transition-all [&>button]:duration-100"
			>
				<button onclick={insertElementToBeShared} data-tag="h1">h1</button>
				<button onclick={insertElementToBeShared} data-tag="h3">h3</button>
				<button onclick={insertElementToBeShared} data-tag="p">paragraph</button>
				<button onclick={insertElementToBeShared} data-tag="img" data-self-closing>image</button>
				<button onclick={insertElementToBeShared} data-tag="button">button</button>
				<button onclick={insertElementToBeShared} data-tag="input" data-self-closing>input</button>
			</div>
			<button
				onclick={shareHtmlToBeShared}
				class="border-2 border-green-800 px-1 text-2xl text-green-800 hover:bg-green-800 hover:text-white active:scale-90"
				>Share element!</button
			>
		</div>
	{/if}

	<button
		class="flex items-center gap-2 bg-[#09122C] p-1 text-white transition-all hover:shadow-[-2.5px_-2.5px_0px_#09122C,-2.5px_2.5px_0px_#09122C,0px_-2.5px_0px_#09122C,0px_2.5px_0px_#09122C,-5px_5px_10px_gray]"
		onclick={async (e) => {
			await navigator.clipboard.writeText(window.location.href);
			copy_tick.style.display = 'block';
			setTimeout(() => (copy_tick.style.display = 'none'), 1000);
		}}
		><svg width="24px" height="24px" viewBox="0 0 24 24">
			<CopyIcn stroke="currentColor"></CopyIcn>
			<path
				bind:this={copy_tick}
				d="M6.08008 15L8.03008 16.95L11.9201 13.05"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>join link</button
	>
	{#if data.is_admin}
		<button
			onclick={async (e) => await destroyOwnSession()}
			class="flex items-center gap-2 bg-[#872341] p-1 text-white transition-all hover:shadow-[2.5px_-2.5px_0px_#872341,2.5px_2.5px_0px_#872341,0px_-2.5px_0px_#872341,0px_2.5px_0px_#872341,5px_5px_10px_gray]"
		>
			<svg width="24px" height="24px" viewBox="0 0 32 32">
				<Explosion fill="currentColor"></Explosion>
			</svg>explode session
		</button>
	{/if}
</nav>
<main class="h-[calc(100dvh-40px)] w-full"></main>

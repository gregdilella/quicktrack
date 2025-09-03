<script lang="ts">
	import { Calendar } from "$lib/components/ui/calendar";
	import * as Popover from "$lib/components/ui/popover";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { cn } from "$lib/utils";
	import { parseDate, getLocalTimeZone, type DateValue } from "@internationalized/date";

	interface Props {
		value?: string | null;
		placeholder?: string;
		class?: string;
		disabled?: boolean;
		onchange?: () => void;
	}

	let {
		value = $bindable(),
		placeholder = "Pick a date and time",
		class: className = "",
		disabled = false,
		onchange
	}: Props = $props();

	// Internal state
	let open = $state(false);
	let selectedDate: DateValue | undefined = $state();
	let timeValue = $state("12:00");

	// Convert string value to DateValue and time when value changes externally
	// Only run when the value is different from what we expect
	let expectedValue = value;
	$effect(() => {
		if (value !== expectedValue) {
			expectedValue = value;
			if (value) {
				try {
					const date = new Date(value);
					const year = date.getFullYear();
					const month = date.getMonth() + 1;
					const day = date.getDate();
					selectedDate = parseDate(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
					
					const hours = date.getHours().toString().padStart(2, '0');
					const minutes = date.getMinutes().toString().padStart(2, '0');
					timeValue = `${hours}:${minutes}`;
				} catch (e) {
					selectedDate = undefined;
					timeValue = "12:00";
				}
			} else {
				selectedDate = undefined;
				timeValue = "12:00";
			}
		}
	});

	// Update value when date or time changes
	function updateValue() {
		if (selectedDate) {
			const [hours, minutes] = timeValue.split(':').map(Number);
			const date = selectedDate.toDate(getLocalTimeZone());
			date.setHours(hours, minutes, 0, 0);
			
			// Convert to datetime-local format
			const localDateTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
				.toISOString()
				.slice(0, 16);
			value = localDateTime;
			expectedValue = localDateTime; // Update expected value to prevent effect loop
		} else {
			value = null;
			expectedValue = null;
		}
		
		if (onchange) {
			onchange();
		}
	}

	// Watch for changes and update value
	// Remove the automatic effect that was causing infinite loops
	// updateValue() will be called manually when user makes changes

	function setToNow() {
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1;
		const day = now.getDate();
		selectedDate = parseDate(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
		
		const hours = now.getHours().toString().padStart(2, '0');
		const minutes = now.getMinutes().toString().padStart(2, '0');
		timeValue = `${hours}:${minutes}`;
		
		updateValue(); // Manually trigger update
		open = false;
	}

	function clearValue() {
		selectedDate = undefined;
		timeValue = "12:00";
		value = null;
		expectedValue = null;
		open = false;
		if (onchange) {
			onchange();
		}
	}

	// Track calendar date selection to detect user interactions
	let lastSelectedDate = $state();
	$effect(() => {
		// Only trigger update when date actually changes from user selection
		if (selectedDate !== lastSelectedDate) {
			lastSelectedDate = selectedDate;
			if (selectedDate && lastSelectedDate !== undefined) {
				updateValue();
			}
		}
	});

	function formatDisplayValue(): string {
		if (value) {
			try {
				const date = new Date(value);
				return date.toLocaleString('en-US', {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				});
			} catch {
				return "";
			}
		}
		return "";
	}
</script>

<div class={cn("relative", className)}>
	<Popover.Root bind:open>
		<Popover.Trigger>
			<Button
				variant="outline"
				class={cn(
					"w-full justify-start text-left font-normal",
					!value && "text-muted-foreground"
				)}
				{disabled}
			>
				📅 {formatDisplayValue() || placeholder}
			</Button>
		</Popover.Trigger>
		<Popover.Content class="w-auto p-0" align="start">
			<div class="p-4 space-y-4">
				<Calendar
					bind:value={selectedDate}
					initialFocus
					type="single"
				/>
				
				<div class="flex items-center gap-2 px-3">
					<span>🕐</span>
					<Input
						type="time"
						bind:value={timeValue}
						class="w-32"
						onchange={() => updateValue()}
					/>
				</div>
				
				<div class="flex gap-2 px-3 pb-2">
					<Button
						size="sm"
						onclick={setToNow}
						class="flex-1"
					>
						Now
					</Button>
					<Button
						size="sm"
						variant="outline"
						onclick={clearValue}
						class="flex-1"
					>
						Clear
					</Button>
				</div>
			</div>
		</Popover.Content>
	</Popover.Root>
</div>

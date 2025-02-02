<script lang="ts">
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import type { ComponentProps } from "svelte";
    import { House, Dumbbell, Bike, ChartColumnBig, ChartLine, Calendar, ChartPie, Library, Map, Sun, Moon } from 'lucide-svelte';	
	import { toggleMode } from "mode-watcher";
	import { Button } from "$lib/components/ui/button/index.js";

    let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root {...restProps} bind:ref class="pl-2 pt-2">
    <Sidebar.Header>
        <div class="flex items-center justify-between ">
            <div>
                <p class="font-bold">Stats for Garmin</p>
                <p>v0.1</p>
                <p>by <a href="https://a0.ax">lev</a></p>
            </div>
			<div class="h-full pr-1">
				<Button variant="outline" size="icon" onclick={toggleMode}>
					<Sun
					class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
					/>
					<Moon
					class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
					/>
					<span class="sr-only">Toggle theme</span>
				</Button>
			</div>
        </div>
    </Sidebar.Header>
    <Sidebar.Content>
        <!-- Hard-coded sidebar content -->
        <Sidebar.Group>
            <Sidebar.GroupContent>
                <Sidebar.Menu>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton isActive={true}>
                            {#snippet child({ props })}
                                <a href="?p=home" {...props}><House /> Home</a>
                            {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton>
                            {#snippet child({ props })}
                                <a href="?p=calendar" {...props}><Calendar /> Calendar</a>
                            {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton>
                            {#snippet child({ props })}
                                <a href="?p=list" {...props}><Library /> All Exercises</a>
                            {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                </Sidebar.Menu>
            </Sidebar.GroupContent>
        </Sidebar.Group>

        <Sidebar.Group>
            <Sidebar.GroupLabel><Dumbbell /> &nbsp; Weightlifting</Sidebar.GroupLabel>
            <Sidebar.GroupContent>
                <Sidebar.Menu>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton isActive={false}>
                            {#snippet child({ props })}
                                <a href="?p=weights-stats" {...props}>Statistics</a>
                            {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton>
                            {#snippet child({ props })}
                                <a href="?p=weights-volume" {...props}>Volume Analysis</a>
                            {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                </Sidebar.Menu>
            </Sidebar.GroupContent>
        </Sidebar.Group>

        <Sidebar.Group>
            <Sidebar.GroupLabel><Bike /> &nbsp; Cycling</Sidebar.GroupLabel>
            <Sidebar.GroupContent>
                <Sidebar.Menu>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton>
                            {#snippet child({ props })}
                                <a href="?p=cycling-stats" {...props}>Statistics</a>
                            {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton>
                            {#snippet child({ props })}
                                <a href="?p=cycling-map" {...props}>Map</a>
                            {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                </Sidebar.Menu>
            </Sidebar.GroupContent>
        </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Rail />
</Sidebar.Root>
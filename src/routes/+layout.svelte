<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
    import '../app.css';

    let { children } = $props();
</script>
<head>
    <title>muscles.ooo</title>
</head>

<ModeWatcher />
{@render children()}
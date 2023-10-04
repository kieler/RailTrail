/**
 * A spinning loading indicator. Will pulse instead if the user prefers reduced motion
 */
export function Spinner({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox={"0 0 48 48"}>
			<circle
				className={"origin-center stroke-6 fill-none stroke-slate-400 dark:stroke-slate-600"}
				cx={24}
				cy={24}
				r={20}
			/>
			<path
				className={
					"motion-safe:animate-spin-ease motion-reduce:animate-pulse origin-center stroke-6 fill-none stroke-slate-900 dark:stroke-slate-100"
				}
				d={"M 12 40 A 20 20 0 1 1 40 12"}
			/>
		</svg>
	);
}

import Select, { GroupBase, Props } from "react-select";

export function StyledSelect<
	Option = unknown,
	IsMulti extends boolean = false,
	Group extends GroupBase<Option> = GroupBase<Option>
>(props: Omit<Props<Option, IsMulti, Group>, "className" | "unstyled" | "classNames"> & { width?: 4 | 5 }) {
	const spanClass = props.width == 4 ? "col-span-4" : props.width == 5 ? "col-span-5" : "col-span-5";
	return (
		<Select<Option, IsMulti, Group>
			className={`${spanClass} border border-gray-500 dark:bg-slate-700 rounded`}
			unstyled={true}
			classNames={
				/*
            The zoom controls of a leaflet map use a z-index of 1000. So to display
             the select dropdown in front of the map, we need the z-index to be > 1000.
             Unfortunately, react-select sets the z-index to 1, without an obvious way
             to change this, so we use an important class.
             The same applies to background color, which is why we need to set that one
             important for proper dark-mode support...
              */
				{
					menu: () => "!z-1100 dark:bg-slate-700 bg-white my-2 rounded-md drop-shadow-lg",
					valueContainer: () => "mx-3",
					dropdownIndicator: () =>
						"m-2 text-gray-500 transition-colors hover:dark:text-gray-50 hover:text-gray-950",
					indicatorSeparator: () => "bg-gray-200 dark:bg-gray-500 my-2",
					menuList: () => "py-1",
					option: state => {
						if (state.isSelected) {
							return "px-3 py-2 dark:bg-blue-200 dark:text-black bg-blue-800 text-white";
						} else if (state.isFocused) {
							return "px-3 py-2 bg-blue-100 dark:bg-blue-900";
						} else {
							return "px-3 py-2";
						}
					}
				}
			}
			{...props}
		/>
	);
}

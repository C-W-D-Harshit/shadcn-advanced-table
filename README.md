# Shadcn Advanced Table

A powerful and customizable table component for React applications, built with Shadcn UI. This component is designed to handle large datasets while providing a smooth user experience with features like sticky headers, sticky columns, pagination, and dynamic data fetching.

## Features

- **Sticky Headers and Columns**: Keep important columns and headers always visible while scrolling.
- **Pagination**: Built-in support for pagination, suitable for large datasets.
- **Sorting**: Enable sortable columns for dynamic data presentation.
- **Dynamic Rows and Columns**: Easily define the structure of your table data.
- **Custom Cell Renderers**: Render custom components in table cells.
- **Dynamic Data Fetching**: Fetch data dynamically with server-side pagination and sorting.
- **Responsive Design**: Fully optimized for various screen sizes.
- **Shadcn UI Integration**: Styled with Shadcn components for a seamless design experience.

## Installation

Clone the repository:

```
git clone <repository-url>
```

## Prerequisites

- React
- Next.js
- Lucide-React Icons
- Shadcn Components (Button, Checkbox, Select, Badge, etc.)
- Utility Function (cn from "@/lib/utils")

## Props

- `columns`: An array defining the structure and behavior of each column.
- `key`: Unique identifier for the column (based on the data key).
- `header`: The header text for the column.
- `sortable` (optional): Enables sorting for the column.
- `sticky` (optional): Makes the column sticky during horizontal scrolling.
- `width` (optional): Custom width for the column.
- `cellRenderer` (optional): Custom renderer for cell values (receives value and row).
- `data`: An array of objects representing the rows in the table.
- `dynamic` (optional): A boolean flag to enable dynamic data fetching.
- `onFetchData` (optional): A function to fetch data dynamically when dynamic is true. Receives an object containing:
  - `page`: Current page number.
  - `itemsPerPage`: Number of items per page.
  - `sortColumn` (optional): Column being sorted.
  - `sortDirection` (optional): Sorting direction (asc or desc).

Returns a Promise resolving to an object containing:

- `data`: Fetched data array.
- `totalItems`: Total number of items.

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests to enhance the table’s functionality.

## License

This project is licensed under the MIT License.

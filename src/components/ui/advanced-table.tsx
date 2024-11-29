/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  FileIcon,
  ImageIcon,
  FileTextIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

type SortDirection = "asc" | "desc";

interface ReactNodeAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface CellData<T> {
  value: any;
  rowSpan?: number;
  colSpan?: number;
  cellRenderer?: (value: any, row: T) => React.ReactNode;
}

interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  sticky?: boolean;
  width?: number;
  cellRenderer?: (value: any, row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
}

const Table = <T extends Record<string, any>>({
  columns,
  data: initialData,
  isLoading = false,
}: TableProps<T>) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState(initialData);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(
    null
  );
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  const [totalItems, setTotalItems] = useState(initialData.length);

  const stickyOffsets = columns.reduce((acc, column, index) => {
    if (!column.sticky) return acc;
    const prevOffset = index > 0 ? acc[columns[index - 1].key] || 0 : 0;
    acc[column.key] = prevOffset + (column.width || 150);
    return acc;
  }, {} as Record<keyof T, number>);

  useEffect(() => {
    const page = Number(searchParams.get("page")) || 1;
    const perPage = Number(searchParams.get("itemsPerPage")) || 20;
    const sortCol = searchParams.get("sortColumn") as keyof T | null;
    const sortDir = searchParams.get("sortDirection") as SortDirection | null;

    setCurrentPage(page);
    setItemsPerPage(perPage);
    setSortColumn(sortCol);
    setSortDirection(sortDir);
  }, [searchParams]);

  useEffect(() => {
    setData(initialData);
    setTotalItems(initialData.length);
  }, [initialData]);

  const updateSearchParams = useCallback(
    (params: Record<string, string | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, value);
        }
      });
      router.push(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleSort = useCallback(
    (column: Column<T>) => {
      if (!column.sortable) return;

      const newDirection =
        sortColumn === column.key && sortDirection === "asc" ? "desc" : "asc";
      setSortColumn(column.key);
      setSortDirection(newDirection);
      updateSearchParams({
        sortColumn: column.key as string,
        sortDirection: newDirection,
        page: "1",
      });
    },
    [sortColumn, sortDirection, updateSearchParams]
  );

  const handleClearSort = useCallback(() => {
    setSortColumn(null);
    setSortDirection(null);
    updateSearchParams({
      sortColumn: null,
      sortDirection: null,
      page: "1",
    });
  }, [updateSearchParams]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
      updateSearchParams({ page: newPage.toString() });
    },
    [updateSearchParams]
  );

  const handleItemsPerPageChange = useCallback(
    (value: string) => {
      const newItemsPerPage = Number(value);
      setItemsPerPage(newItemsPerPage);
      setCurrentPage(1);
      updateSearchParams({ page: "1", itemsPerPage: value });
    },
    [updateSearchParams]
  );

  const toggleRowSelection = useCallback((row: T) => {
    setSelectedRows((prev) => {
      const isSelected = prev.some((r) => r === row);
      return isSelected ? prev.filter((r) => r !== row) : [...prev, row];
    });
  }, []);

  const toggleAllRows = useCallback(() => {
    setSelectedRows((prev) => (prev.length === data.length ? [] : [...data]));
  }, [data]);

  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      if (a[sortColumn] < b[sortColumn])
        return sortDirection === "asc" ? -1 : 1;
      if (a[sortColumn] > b[sortColumn])
        return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  console.log(data, sortedData, paginatedData);

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col">
      <div className="relative flex-1 overflow-auto rounded-md border border-border">
        <table className="w-full border-collapse">
          <TableHeader
            columns={columns}
            onSort={handleSort}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onClearSort={handleClearSort}
            stickyOffsets={stickyOffsets}
            onSelectAll={toggleAllRows}
            allSelected={selectedRows.length === data.length}
          />
          <tbody>
            {isLoading
              ? Array.from({ length: 20 }).map((_, index) => (
                  <TableRowSkeleton key={index} columns={columns} />
                ))
              : sortedData.map((row, index) => (
                  <TableRow
                    key={index}
                    columns={columns}
                    row={row}
                    index={index}
                    stickyOffsets={stickyOffsets}
                    isSelected={selectedRows.includes(row)}
                    onSelect={() => toggleRowSelection(row)}
                  />
                ))}
          </tbody>
        </table>
      </div>
      {/* <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        totalItems={totalItems}
      /> */}
    </div>
  );
};

const TableHeader = <T extends Record<string, any>>({
  columns,
  onSort,
  sortColumn,
  sortDirection,
  onClearSort,
  stickyOffsets,
  onSelectAll,
  allSelected,
}: {
  columns: Column<T>[];
  onSort: (column: Column<T>) => void;
  sortColumn: keyof T | null;
  sortDirection: SortDirection | null;
  onClearSort: () => void;
  stickyOffsets: Record<keyof T, number>;
  onSelectAll: () => void;
  allSelected: boolean;
}) => (
  <thead className="sticky top-0 z-10 bg-background drop-shadow-md">
    <tr className="border-b border-border">
      <th className="sticky left-0 w-10 bg-background px-2">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onSelectAll}
          aria-label="Select all rows"
          className="bg-background"
        />
      </th>
      {columns.map((column, columnIndex) => {
        const isSticky = column.sticky;
        const leftOffset = isSticky
          ? stickyOffsets[column.key] - (column.width || 150) + 30
          : undefined;
        const isLastSticky =
          isSticky && columns[columnIndex + 1]?.sticky !== true;

        return (
          <th
            key={column.key as string}
            className={cn(
              "h-11 px-4 text-left text-sm font-medium text-muted-foreground",
              "border-r border-border",
              column.sortable && "cursor-pointer select-none",
              isSticky && "sticky bg-background",
              isSticky &&
                "after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border",
              isLastSticky && "after:shadow-[2px_0_4px_rgba(0,0,0,0.1)]"
            )}
            style={{
              minWidth: column.width || 150,
              width: column.width || 150,
              left: leftOffset,
            }}
            onClick={() => column.sortable && onSort(column)}
          >
            <div className="flex items-center gap-1">
              {column.header}
              {column.sortable && (
                <div className="ml-1 flex h-4 w-4 items-center justify-center">
                  {sortColumn === column.key ? (
                    sortDirection === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                  )}
                </div>
              )}
            </div>
          </th>
        );
      })}
      {(sortColumn || sortDirection) && (
        <th className="sticky right-0 z-20 w-10 bg-background px-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onClearSort();
            }}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </th>
      )}
    </tr>
  </thead>
);

const TableRow = <T extends Record<string, any>>({
  columns,
  row,
  index,
  stickyOffsets,
  isSelected,
  onSelect,
}: {
  columns: Column<T>[];
  row: T;
  index: number;
  stickyOffsets: Record<keyof T, number>;
  isSelected: boolean;
  onSelect: () => void;
}) => (
  <tr
    className={cn(
      "transition-colors ",
      index % 2 === 0 ? "bg-muted" : "bg-background",
      isSelected && ""
    )}
  >
    <td className="sticky left-0 w-10 bg-background px-2">
      <Checkbox
        checked={isSelected}
        onCheckedChange={onSelect}
        aria-label={`Select row ${index + 1}`}
      />
    </td>
    {columns.map((column, columnIndex) => {
      const cellData: CellData<T> =
        typeof row[column.key] === "object" && row[column.key] !== null
          ? (row[column.key] as CellData<T>)
          : { value: row[column.key] };

      if (cellData.colSpan === 0 || cellData.rowSpan === 0) {
        return null;
      }

      const isSticky = column.sticky;
      const leftOffset = isSticky
        ? stickyOffsets[column.key] - (column.width || 150) + 30
        : undefined;
      const isLastSticky =
        isSticky && columns[columnIndex + 1]?.sticky !== true;

      return (
        <TableCell
          key={column.key as string}
          sticky={isSticky}
          style={{
            minWidth: column.width || 150,
            width: column.width || 150,
            left: leftOffset,
          }}
          isEven={index % 2 === 0}
          isLastSticky={isLastSticky}
          colSpan={cellData.colSpan}
          rowSpan={cellData.rowSpan}
        >
          {cellData.cellRenderer
            ? cellData.cellRenderer(cellData.value, row)
            : column.cellRenderer
            ? column.cellRenderer(cellData.value, row)
            : cellData.value}
        </TableCell>
      );
    })}
  </tr>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TableRowSkeleton = <T extends Record<string, unknown>>({
  columns,
}: {
  columns: Column<T>[];
}) => (
  <tr className="bg-background">
    <td className="w-10 px-2 py-4">
      <Skeleton className="h-4 w-4" />
    </td>
    {columns.map((column) => (
      <td key={column.key as string} className="px-4 py-4">
        <Skeleton className="h-8 w-full" />
      </td>
    ))}
  </tr>
);

const TableCell = ({
  children,
  sticky,
  style,
  isEven,
  isLastSticky,
  colSpan,
  rowSpan,
}: {
  children: React.ReactNode;
  sticky?: boolean;
  style?: React.CSSProperties;
  isEven: boolean;
  isLastSticky?: boolean;
  colSpan?: number;
  rowSpan?: number;
}) => (
  <td
    className={cn(
      "border-r border-border px-4 py-3 text-sm",
      sticky && "sticky bg-background border-r-0",
      sticky &&
        "after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border",
      isLastSticky && "after:drop-shadow-lg",
      isEven ? "bg-muted" : "bg-background"
    )}
    style={style}
    colSpan={colSpan}
    rowSpan={rowSpan}
  >
    {children}
  </td>
);

const TablePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: string) => void;
  totalItems: number;
}) => {
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between gap-2 border-t border-border bg-background px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Rows per page</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={onItemsPerPageChange}
        >
          <SelectTrigger className="h-8 w-16">
            <SelectValue placeholder={itemsPerPage} />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>
          {start}-{end} of {totalItems}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Example usage with rowspan and colspan
export default function DynamicTableExample() {
  const columns: Column<(typeof mockData)[0]>[] = [
    { key: "id", header: "ID", sortable: true, sticky: true, width: 80 },
    { key: "name", header: "Name", sortable: true, sticky: true, width: 200 },
    { key: "email", header: "Email", sortable: true, width: 250 },
    {
      key: "role",
      header: "Role",
      width: 150,
      cellRenderer: (value) => (
        <Select value={value}>
          <SelectTrigger className="w-[180px] z-0">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="User">User</SelectItem>
            <SelectItem value="Manager">Manager</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    { key: "department", header: "Department", width: 200 },
    {
      key: "status",
      header: "Status",
      width: 150,
      cellRenderer: (value) => (
        <Select value={value}>
          <SelectTrigger className="w-[180px] z-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "lastLogin",
      header: "Last Login",
      width: 200,
      cellRenderer: (value) => new Date(value).toLocaleString(),
    },
    {
      key: "attachment",
      header: "Attachment",
      width: 300,
    },
  ];

  const mockData = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "Admin",
      department: { value: "IT", rowSpan: 2 },
      status: "Active",
      lastLogin: "sdf",
      attachment: {
        id: "file-1",
        name: "document.pdf",
        size: 1024 * 1024,
        type: "application/pdf",
      },
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "User",
      department: { value: "IT", colSpan: 0 },
      status: "Active",
      lastLogin: new Date().toISOString(),
      attachment: {
        id: "file-2",
        name: "image.jpg",
        size: 2 * 1024 * 1024,
        type: "image/jpeg",
      },
    },
    {
      id: 3,
      name: { value: "Team Overview", colSpan: 4 },
      email: { colSpan: 0 },
      role: { colSpan: 0 },
      department: { colSpan: 0 },
      status: "N/A",
      lastLogin: "N/A",
      attachment: { value: "No attachments", colSpan: 2 },
    },
    // Add more mock data as needed
  ];

  return (
    <div className="flex h-full flex-col space-y-4">
      <Table columns={columns} data={mockData} />
    </div>
  );
}

export {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TablePagination,
  type Column,
  type TableProps,
  type SortDirection,
  type ReactNodeAttachment,
  type CellData,
};

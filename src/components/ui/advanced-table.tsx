/* eslint-disable @typescript-eslint/no-unused-vars */
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

type SortDirection = "asc" | "desc";

interface ReactNodeAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  sticky?: boolean;
  width?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cellRenderer?: (value: any, row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  dynamic?: boolean;
  onFetchData?: (params: {
    page: number;
    itemsPerPage: number;
    sortColumn?: string;
    sortDirection?: SortDirection;
  }) => Promise<{ data: T[]; totalItems: number }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Table = <T extends Record<string, any>>({
  columns,
  data: initialData,
  dynamic = false,
  onFetchData,
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);

  const stickyOffsets = columns.reduce((acc, column, index) => {
    if (!column.sticky) return acc;
    const prevOffset = index > 0 ? acc[columns[index - 1].key] || 0 : 0;
    acc[column.key] = prevOffset + (column.width || 150);
    return acc;
  }, {} as Record<keyof T, number>);

  const fetchData = useCallback(async () => {
    if (!dynamic || !onFetchData) return;

    setLoading(true);
    try {
      const result = await onFetchData({
        page: currentPage,
        itemsPerPage,
        sortColumn: sortColumn as string,
        sortDirection: sortDirection || undefined,
      });
      setData(result.data);
      setTotalItems(result.totalItems);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [
    dynamic,
    onFetchData,
    currentPage,
    itemsPerPage,
    sortColumn,
    sortDirection,
  ]);

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
    fetchData();
  }, [fetchData]);

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
    if (dynamic || !sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      if (a[sortColumn] < b[sortColumn])
        return sortDirection === "asc" ? -1 : 1;
      if (a[sortColumn] > b[sortColumn])
        return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection, dynamic]);

  const paginatedData = dynamic
    ? sortedData
    : sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="flex h-full flex-col">
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
            {paginatedData.map((row, index) => (
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
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        totalItems={totalItems}
      />
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  <thead className="sticky top-0 z-10 bg-background">
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        >
          {column.cellRenderer
            ? column.cellRenderer(row[column.key], row)
            : row[column.key]}
        </TableCell>
      );
    })}
  </tr>
);

const TableCell = ({
  children,
  sticky,
  style,
  isEven,
  isLastSticky,
}: {
  children: React.ReactNode;
  sticky?: boolean;
  style?: React.CSSProperties;
  isEven: boolean;
  isLastSticky?: boolean;
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

/**
 * This component needs the use client.
 * @deprecated This component is deprecated and should not be used in new code.
 *
 * A React component that renders an attachment cell with an icon, name, and size.
 *
 * @param {Object} props - The props object.
 * @param {ReactNodeAttachment} props.attachment - The attachment object containing type, name, and size.
 *
 * @returns {JSX.Element} The rendered attachment cell component.
 */
const AttachmentCell = ({
  attachment,
}: {
  attachment: ReactNodeAttachment;
}) => {
  const getIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-5 w-5" />;
    if (type === "application/pdf") return <FileTextIcon className="h-5 w-5" />;
    return <FileIcon className="h-5 w-5" />;
  };

  return (
    <div className="flex items-center gap-2">
      {getIcon(attachment.type)}
      <span>{attachment.name}</span>
      <span className="text-xs text-muted-foreground">
        ({(attachment.size / 1024).toFixed(2)} KB)
      </span>
    </div>
  );
};

// Example usage with dynamic data fetching and custom cell renderers
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
      cellRenderer: (value: ReactNodeAttachment) => (
        <AttachmentCell attachment={value} />
      ),
    },
    // need 20 more columns
    { key: "phone", header: "Phone", width: 150 },
    { key: "address", header: "Address", width: 300 },
    { key: "city", header: "City", width: 150 },
    { key: "state", header: "State", width: 100 },
    { key: "zip", header: "Zip Code", width: 100 },
    { key: "country", header: "Country", width: 150 },
    { key: "company", header: "Company", width: 200 },
    { key: "position", header: "Position", width: 200 },
    {
      key: "hireDate",
      header: "Hire Date",
      width: 200,
      cellRenderer: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "salary",
      header: "Salary",
      width: 150,
      cellRenderer: (value) => `$${value?.toLocaleString()}`,
    },
    { key: "manager", header: "Manager", width: 200 },
    { key: "team", header: "Team", width: 200 },
    { key: "project", header: "Project", width: 200 },
    {
      key: "skills",
      header: "Skills",
      width: 300,
      cellRenderer: (value) => value.join(", "),
    },
    {
      key: "experience",
      header: "Experience",
      width: 150,
      cellRenderer: (value) => `${value} years`,
    },
    { key: "education", header: "Education", width: 200 },
    {
      key: "certifications",
      header: "Certifications",
      width: 300,
      cellRenderer: (value) => value.join(", "),
    },
    {
      key: "languages",
      header: "Languages",
      width: 200,
      cellRenderer: (value) => value.join(", "),
    },
    { key: "availability", header: "Availability", width: 150 },
    { key: "notes", header: "Notes", width: 300 },
  ];

  const mockData = Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i % 3 === 0 ? "Admin" : i % 3 === 1 ? "User" : "Manager",
    department: ["IT", "HR", "Finance", "Marketing", "Sales"][i % 5],
    status: i % 5 === 0 ? "Inactive" : "Active",
    lastLogin: new Date(
      Date.now() - Math.floor(Math.random() * 10000000000)
    ).toISOString(),
    attachment: {
      id: `file-${i}`,
      name: `document-${i}.pdf`,
      size: Math.floor(Math.random() * 1000000),
      type: "application/pdf",
    },
    phone: `123-456-789${i % 10}`,
    address: `123 Main St Apt ${i + 1}`,
    city: `City ${i % 10}`,
    state: `State ${i % 5}`,
    zip: `1234${i % 10}`,
    country: `Country ${i % 5}`,
    company: `Company ${i % 10}`,
    position: `Position ${i % 10}`,
    hireDate: new Date(
      Date.now() - Math.floor(Math.random() * 10000000000)
    ).toISOString(),
    salary: Math.floor(Math.random() * 100000),
    manager: `Manager ${i % 10}`,
    team: `Team ${i % 10}`,
    project: `Project ${i % 10}`,
    skills: ["Skill1", "Skill2", "Skill3"],
    experience: Math.floor(Math.random() * 20),
    education: `Education ${i % 10}`,
    certifications: ["Cert1", "Cert2"],
    languages: ["English", "Spanish"],
    availability: `Availability ${i % 10}`,
    notes: `Notes ${i % 10}`,
  }));

  const fetchData = async (params: {
    page: number;
    itemsPerPage: number;
    sortColumn?: string;
    sortDirection?: SortDirection;
  }) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const filteredData = [...mockData];

    if (params.sortColumn && params.sortDirection) {
      filteredData.sort((a, b) => {
        if (
          a[params.sortColumn as keyof (typeof mockData)[0]] <
          b[params.sortColumn as keyof (typeof mockData)[0]]
        )
          return params.sortDirection === "asc" ? -1 : 1;
        if (
          a[params.sortColumn as keyof (typeof mockData)[0]] >
          b[params.sortColumn as keyof (typeof mockData)[0]]
        )
          return params.sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    const start = (params.page - 1) * params.itemsPerPage;
    const end = start + params.itemsPerPage;
    const paginatedData = filteredData.slice(start, end);

    return {
      data: paginatedData,
      totalItems: mockData.length,
    };
  };

  return (
    <div className="flex h-full flex-col space-y-4">
      <Table columns={columns} data={[]} dynamic onFetchData={fetchData} />
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
};

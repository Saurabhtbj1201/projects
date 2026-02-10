import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
}

const CategorySelect = ({ value, onChange, categories }: CategorySelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    setSearchValue("");
  };

  const handleAddNew = () => {
    if (searchValue.trim()) {
      onChange(searchValue.trim());
      setOpen(false);
      setSearchValue("");
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(searchValue.toLowerCase())
  );

  const showAddNew =
    searchValue.trim() &&
    !categories.some((cat) => cat.toLowerCase() === searchValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || "Select or add category..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or add category..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty className="py-2">
              {showAddNew ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={handleAddNew}
                >
                  <Plus className="h-4 w-4" />
                  Add "{searchValue}"
                </Button>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  No categories found.
                </p>
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredCategories.map((category) => (
                <CommandItem
                  key={category}
                  value={category}
                  onSelect={() => handleSelect(category)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {category}
                </CommandItem>
              ))}
              {showAddNew && filteredCategories.length > 0 && (
                <CommandItem
                  value={`add-${searchValue}`}
                  onSelect={handleAddNew}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add "{searchValue}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CategorySelect;

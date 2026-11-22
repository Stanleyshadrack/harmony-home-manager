import type {ReactNode} from 'react';
import {MoreHorizontal} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/components/ui/table';
import {DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuSeparator,DropdownMenuTrigger} from '@/components/ui/dropdown-menu';

export type RecordAction = {
  label:string;
  onSelect:()=>void;
  destructive?:boolean;
  disabled?:boolean;
  separatorBefore?:boolean;
};

export type RecordColumn<T> = {
  key:string;
  header:string;
  render:(item:T)=>ReactNode;
  className?:string;
};

/** Accessible, horizontally scrollable list view, with all row actions in the last column. */
export function RecordListTable<T>({
  records,columns,getKey,actions,emptyMessage='No records found'
}:{
  records:readonly T[];
  columns:readonly RecordColumn<T>[];
  getKey:(item:T)=>string|number;
  actions:(item:T)=>RecordAction[];
  emptyMessage?:string;
}){
  return <div className="min-w-0 overflow-x-auto rounded-lg border bg-card">
    <Table className="min-w-[660px]">
      <TableHeader><TableRow>
        {columns.map(col=><TableHead key={col.key} scope="col" className={col.className}>{col.header}</TableHead>)}
        <TableHead scope="col" className="w-[72px] text-right">Actions</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {records.length===0?<TableRow><TableCell colSpan={columns.length+1} className="py-12 text-center text-muted-foreground">{emptyMessage}</TableCell></TableRow>:
        records.map(item=><TableRow key={getKey(item)}>
          {columns.map(col=><TableCell key={col.key} className={col.className}>{col.render(item)}</TableCell>)}
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label={`Actions for row ${getKey(item)}`}>
                  <MoreHorizontal className="h-4 w-4"/><span className="sr-only">Row actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[170px]">
                {actions(item).map((action,i)=><div key={i}>
                  {action.separatorBefore&&<DropdownMenuSeparator/>}
                  <DropdownMenuItem disabled={action.disabled}
                    className={action.destructive?'text-destructive focus:text-destructive':undefined}
                    onSelect={action.onSelect}>{action.label}</DropdownMenuItem>
                </div>)}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>)}
      </TableBody>
    </Table>
  </div>;
}

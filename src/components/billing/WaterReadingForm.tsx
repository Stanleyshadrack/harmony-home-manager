import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUnits } from "@/hooks/useProperties"
import { useMeters } from '@/hooks/useMeters'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { WaterReadingFormData } from '@/types/billing'
import { useState } from 'react'


const waterReadingSchema = z.object({
  unitId: z.number(),
  meterId: z.string().min(1, "Meter ID is required"),
  previousReading: z.number().min(0),
  currentReading: z.number().min(0),
  ratePerUnit: z.number().min(0.01),
  readingDate: z.string(),
  billingPeriod: z.string(),
})


interface WaterReadingFormProps {
  onSubmit: (data: WaterReadingFormData) => void | Promise<void>
  allowedUnitIds?: number[]
  onCancel: () => void
  isLoading?: boolean
}


export function WaterReadingForm({ onSubmit, onCancel, isLoading, allowedUnitIds }: WaterReadingFormProps) {

  const { t } = useTranslation()
  const { units, isLoading: unitsLoading } = useUnits()
  const selectableUnits = allowedUnitIds ? units.filter(u => allowedUnitIds.includes(Number(u.id))) : units
  const { meters, loading: metersLoading } = useMeters()
  const [lastReadingDate, setLastReadingDate] = useState<string | null>(null)



  const form = useForm<WaterReadingFormData>({
    resolver: zodResolver(waterReadingSchema),
    defaultValues: {
      unitId: undefined,
      meterId: '',
      previousReading: 0,
      currentReading: 0,
      ratePerUnit: 1,
      readingDate: new Date().toISOString().split('T')[0],
      billingPeriod: new Date().toISOString().slice(0,7),
    },
  })



  const selectedUnit = selectableUnits.find(u => Number(u.id) === Number(form.watch('unitId')))
  const previousReading = form.watch('previousReading')
  const currentReading = form.watch('currentReading')
  const ratePerUnit = form.watch('ratePerUnit')
  const [meterName, setMeterName] = useState("")
  const consumption = Math.max(0, currentReading - previousReading)
  const estimatedBill = consumption * ratePerUnit




const handleUnitChange = (unitId: number) => {
  const selectedMeter = meters.find(m => Number(m.unitId) === unitId && m.status === 'ACTIVE')
  setLastReadingDate(selectedMeter?.lastReadingDate || null)
  form.setValue("meterId", selectedMeter?.id != null ? String(selectedMeter.id) : "")
  setMeterName(selectedMeter?.meterName || "")
  form.setValue("previousReading", Number(selectedMeter?.lastReading ?? 0))
  form.setValue("currentReading", Number(selectedMeter?.lastReading ?? 0))
}


  const handleSubmit = async (data: WaterReadingFormData) => {
    if (!data.meterId) {
      form.setError('meterId', { message: 'Selected unit has no active assigned meter' })
      return
    }
    if (data.currentReading < data.previousReading) {
      form.setError('currentReading', { message: 'Current reading cannot be below the meter baseline' })
      return
    }
    await onSubmit(data)
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">


        {/* UNIT SELECT */}
        <FormField
          control={form.control}
          name="unitId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('units.title')}</FormLabel>

              <Select
  value={field.value ? String(field.value) : ""}

                onValueChange={(value) => {
                  const unitId = Number(value)
                  field.onChange(unitId)
                  handleUnitChange(unitId)
                }}
              >

                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={unitsLoading || metersLoading ? "Loading units and meters..." : "Select unit"}
                    />
                  </SelectTrigger>
                </FormControl>

                <SelectContent>
                  {selectableUnits.map((unit) => (
                    <SelectItem
  key={unit.id}
  value={String(unit.id)}
  disabled={!meters.some(m => Number(m.unitId) === Number(unit.id) && m.status === 'ACTIVE')}
>
  {unit.unitNumber}{unit.status === 'vacant' ? ' — Vacant' : ''}
  {!meters.some(m => Number(m.unitId) === Number(unit.id) && m.status === "ACTIVE") && " (No active meter)"}
</SelectItem>

                  ))}
                </SelectContent>

              </Select>

              <FormMessage />
            </FormItem>
          )}
        />


        {selectedUnit?.status === 'vacant' && (
          <div role="status" className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-foreground">
            <strong>Vacant unit:</strong> Record the meter normally to preserve consumption history.
            Water used while the unit is vacant must be reviewed separately and must not be charged to a future tenant.
          </div>
        )}

        {/* METER ID (AUTOFILLED) */}
        <FormField
          control={form.control}
          name="meterId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('units.meterId')}</FormLabel>

              <FormControl>
                <Input
  value={meterName}
  placeholder="Auto-filled"
  readOnly
  className="bg-muted"
/>

              </FormControl>

              <FormDescription>
                Auto-filled from the selected unit
              </FormDescription>

              <FormMessage />
            </FormItem>
          )}
        />


        {/* READINGS */}
        <div className="grid grid-cols-2 gap-4">

          {/* PREVIOUS READING (DISPLAY ONLY) */}
          <FormField
            control={form.control}
            name="previousReading"
            render={({ field }) => (
              <FormItem>

                <FormLabel>Previous Reading</FormLabel>

                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    readOnly
                    className="bg-muted"
                  />
                </FormControl>

            <FormDescription>
  {lastReadingDate
    ? `Last reading on ${new Date(lastReadingDate).toLocaleDateString()}`
    : "Automatically calculated from the last reading"}
</FormDescription>



                <FormMessage />
              </FormItem>
            )}
          />


          {/* CURRENT READING */}
          <FormField
            control={form.control}
            name="currentReading"
            render={({ field }) => (
              <FormItem>

                <FormLabel>Current Reading</FormLabel>

                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>

                <FormMessage />

              </FormItem>
            )}
          />

        </div>


        {/* RATE */}
        <FormField
          control={form.control}
          name="ratePerUnit"
          render={({ field }) => (
            <FormItem>

              <FormLabel>Rate per Unit (KES)</FormLabel>

              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                />
              </FormControl>

              <FormDescription>
                Price per unit of water consumption
              </FormDescription>

              <FormMessage />

            </FormItem>
          )}
        />


        {/* DATES */}
        <div className="grid grid-cols-2 gap-4">

          <FormField
            control={form.control}
            name="readingDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reading Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field}
                    onChange={e => {
                      field.onChange(e.target.value)
                      form.setValue('billingPeriod', e.target.value.slice(0,7))
                    }} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />


          <FormField
            control={form.control}
            name="billingPeriod"
            render={({ field }) => (
              <FormItem>

                <FormLabel>Billing Period</FormLabel>

                <FormControl>
                  <Input {...field} readOnly className="bg-muted"
                    value={form.watch('readingDate')?.slice(0,7) || ''} />
                </FormControl>

                <FormMessage />

              </FormItem>
            )}
          />

        </div>


        {/* BILL PREVIEW */}
        {currentReading > 0 && (
          <div className="bg-info/10 border border-info/20 rounded-lg p-4">

            <p className="text-sm font-medium text-info mb-2">
              Estimated Consumption Cost
            </p>

            <div className="grid grid-cols-2 gap-2 text-sm">

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Consumption:
                </span>
                <span className="font-medium">
                  {consumption} units
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Estimated Cost:
                </span>
                <span className="font-semibold">
                  KES {estimatedBill.toFixed(2)}
                </span>
              </div>

            </div>
          </div>
        )}


        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pt-4">

          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            {t('common.cancel')}
          </Button>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common.loading') : allowedUnitIds ? 'Submit Reading for Approval' : 'Save Water Reading'}
          </Button>

        </div>

      </form>
    </Form>
  )
}
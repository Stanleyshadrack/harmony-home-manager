import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUnits } from "@/hooks/useProperties"
import { useWaterData } from '@/hooks/useWaterData'
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
})


interface WaterReadingFormProps {
  onSubmit: (data: WaterReadingFormData) => void
  onCancel: () => void
  isLoading?: boolean
}


export function WaterReadingForm({ onSubmit, onCancel, isLoading }: WaterReadingFormProps) {

  const { t } = useTranslation()
  const { units, isLoading: unitsLoading } = useUnits()
  const { readings } = useWaterData()
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
      billingPeriod: new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    },
  })


  const selectedUnitId = form.watch('unitId')
  const unit = units.find((u) => Number(u.id) === selectedUnitId)
  const disabledDates = readings
  .filter((r) => r.unitId === selectedUnitId)
  .map((r) =>
    new Date(r.readingDate).toISOString().split("T")[0]
  );

  const previousReading = form.watch('previousReading')
  const currentReading = form.watch('currentReading')
  const ratePerUnit = form.watch('ratePerUnit')
  const [meterName, setMeterName] = useState("")
  const consumption = Math.max(0, currentReading - previousReading)
  const estimatedBill = consumption * ratePerUnit
    const lastDate = disabledDates[disabledDates.length - 1];


const handleUnitChange = (unitId: number) => {
  const unit = units.find((u) => Number(u.id) === unitId)
  if (!unit) return

  // Autofill meter
  form.setValue("meterId", unit.meterId || "")
  setMeterName(unit.meterName || "")

  console.log("Selected Unit:", unit)

  // ✅ ONLY USE UNIT DATA (NO API)
  if (unit.lastReading !== undefined && unit.lastReading !== null) {
    form.setValue("previousReading", unit.lastReading)
    setLastReadingDate(unit.lastReadingDate || null)
  } else {
    form.setValue("previousReading", 0)
    setLastReadingDate(null)
  }
}



const handleSubmit = (data: WaterReadingFormData) => {

  const formattedDate = new Date(data.readingDate)
    .toISOString()
    .split("T")[0];

  const alreadyExists = readings.some(
    (r) =>
      r.unitId === data.unitId &&
      r.readingDate === formattedDate
  );

  if (alreadyExists) {
    form.setError("readingDate", {
      type: "manual",
      message: "A reading already exists for this date",
    });
    return;
  }

  onSubmit(data);
};


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
                      placeholder={unitsLoading ? "Loading units..." : "Select unit"}
                    />
                  </SelectTrigger>
                </FormControl>

                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem
  key={unit.id}
  value={String(unit.id)}
  disabled={!unit.meterName}
>
  {unit.unitNumber}
  {!unit.meterName && " (No meter)"}
</SelectItem>

                  ))}
                </SelectContent>

              </Select>

              <FormMessage />
            </FormItem>
          )}
        />


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
  {lastDate
    ? `Last reading was on ${new Date(lastDate).toLocaleDateString()}`
    : "No previous readings"}
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

              <FormLabel>Rate per Unit ($)</FormLabel>

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
                  <Input
  type="date"
  {...field}
  onChange={(e) => {
    const selectedDate = e.target.value;

    if (disabledDates.includes(selectedDate)) {
      form.setError("readingDate", {
        type: "manual",
        message: "A reading already exists for this date",
      });
      return;
    }

    form.clearErrors("readingDate");
    field.onChange(selectedDate);
  }}
/>
                </FormControl>
              <FormField
  control={form.control}
  name="readingDate"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Reading Date</FormLabel>

      <FormControl>
        <Input
          type="date"
          {...field}
          onChange={(e) => {
            const selectedDate = e.target.value;

            if (disabledDates.includes(selectedDate)) {
              form.setError("readingDate", {
                type: "manual",
                message: "A reading already exists for this date",
              });
              return;
            }

            form.clearErrors("readingDate");
            field.onChange(selectedDate);
          }}
        />
      </FormControl>

      <FormDescription>
        {disabledDates.length > 0
          ? `Unavailable dates: ${disabledDates.join(", ")}`
          : "No previous readings for this unit"}
      </FormDescription>

      <FormMessage />
    </FormItem>
  )}
/>
                <FormMessage />
              </FormItem>
            )}
          />


        <FormDescription>
  {disabledDates.length > 0
    ? `Unavailable dates: ${disabledDates.join(", ")}`
    : "No previous readings for this unit"}
</FormDescription>

        </div>


        {/* BILL PREVIEW */}
        {currentReading > 0 && (
          <div className="bg-info/10 border border-info/20 rounded-lg p-4">

            <p className="text-sm font-medium text-info mb-2">
              Bill Preview
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
                  Estimated Bill:
                </span>
                <span className="font-semibold">
                  ${estimatedBill.toFixed(2)}
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
            {isLoading ? t('common.loading') : 'Generate Water Bill'}
          </Button>

        </div>

      </form>
    </Form>
  )
}
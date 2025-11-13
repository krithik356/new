import mongoose from 'mongoose'

const { Schema } = mongoose

const ContributionSchema = new Schema(
  {
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    academy: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    intensive: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    niat: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    cycle: {
      type: String,
      default: 'default',
      index: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

ContributionSchema.index({ department: 1, cycle: 1 }, { unique: true })

ContributionSchema.virtual('total').get(function total() {
  return (this.academy ?? 0) + (this.intensive ?? 0) + (this.niat ?? 0)
})

ContributionSchema.pre('validate', function enforceTotals(next) {
  const sum = (this.academy ?? 0) + (this.intensive ?? 0) + (this.niat ?? 0)
  if (Math.abs(sum - 100) > 1e-6) {
    return next(new Error('Contribution allocation must total 100.'))
  }
  return next()
})

export const Contribution = mongoose.model('Contribution', ContributionSchema)


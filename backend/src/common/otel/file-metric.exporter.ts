import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { ExportResult, ExportResultCode } from '@opentelemetry/core'
import {
  PushMetricExporter,
  ResourceMetrics,
  AggregationTemporality,
  InstrumentType,
} from '@opentelemetry/sdk-metrics'
import { Logger } from '@nestjs/common'

export class FileMetricExporter implements PushMetricExporter {
  private _file: string
  private _shutdown = false
  private logger = new Logger(FileMetricExporter.name)

  constructor(filePath?: string) {
    this._file =
      filePath || path.join(os.tmpdir(), `metrics-${Date.now()}.json`)
    this.logger.log(`Writing metrics to ${this._file}`)
  }

  export(
    metrics: ResourceMetrics,
    resultCallback: (result: ExportResult) => void
  ): void {
    if (this._shutdown) {
      setTimeout(
        () =>
          resultCallback({
            code: ExportResultCode.FAILED,
            error: new Error('Exporter has been shut down'),
          }),
        0
      )
      return
    }

    try {
      const json = JSON.stringify(
        metrics,
        (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      )
      // Append to file with a separator or as JSON lines
      fs.appendFile(this._file, json + '\n', (err) => {
        if (err) {
          return resultCallback({
            code: ExportResultCode.FAILED,
            error: err,
          })
        }
        return resultCallback({
          code: ExportResultCode.SUCCESS,
        })
      })
    } catch (e) {
      return resultCallback({
        code: ExportResultCode.FAILED,
        error: e as Error,
      })
    }
  }

  forceFlush(): Promise<void> {
    return Promise.resolve()
  }

  shutdown(): Promise<void> {
    this._shutdown = true
    return Promise.resolve()
  }

  selectAggregationTemporality(
    _instrumentType: InstrumentType
  ): AggregationTemporality {
    return AggregationTemporality.CUMULATIVE
  }
}

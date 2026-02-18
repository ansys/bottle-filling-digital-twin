{{/*
Expand the name of the chart.
*/}}
{{- define "bottle-filling-twin.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
For OKAS compatibility, includes session ID if provided.
*/}}
{{- define "bottle-filling-twin.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if .Values.streamingKit.sessionId }}
{{- printf "%s-%s" $name .Values.streamingKit.sessionId | trunc 63 | trimSuffix "-" }}
{{- else if eq $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "bottle-filling-twin.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels - includes OKAS-specific labels when session info is provided
*/}}
{{- define "bottle-filling-twin.labels" -}}
helm.sh/chart: {{ include "bottle-filling-twin.chart" . }}
{{ include "bottle-filling-twin.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "bottle-filling-twin.selectorLabels" -}}
app.kubernetes.io/name: {{ include "bottle-filling-twin.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "bottle-filling-twin.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "bottle-filling-twin.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Return the appropriate namespace
*/}}
{{- define "bottle-filling-twin.namespace" -}}
{{- if and .Values.global .Values.global.namespace }}
{{- .Values.global.namespace }}
{{- else }}
{{- .Release.Namespace }}
{{- end }}
{{- end }}

{{/*
Generate Envoy ConfigMap name
*/}}
{{- define "bottle-filling-twin.envoyConfigMapName" -}}
{{- printf "%s-envoy" (include "bottle-filling-twin.fullname" .) }}
{{- end }}


{{/*
Generate PVC names with session support
*/}}
{{- define "bottle-filling-twin.pvc.fluentWorkdir" -}}
{{- if .Values.storage.fluentWorkdir.existingClaim }}
{{- .Values.storage.fluentWorkdir.existingClaim }}
{{- else if .Values.streamingKit.sessionId }}
{{- printf "%s-fluent-workdir" (include "bottle-filling-twin.fullname" .) }}
{{- else }}
{{- printf "%s-fluent-workdir" (include "bottle-filling-twin.fullname" .) }}
{{- end }}
{{- end }}

{{- define "bottle-filling-twin.pvc.contentData" -}}
{{- if .Values.storage.contentData.existingClaim }}
{{- .Values.storage.contentData.existingClaim }}
{{- else if .Values.streamingKit.sessionId }}
{{- printf "%s-content-data" (include "bottle-filling-twin.fullname" .) }}
{{- else }}
{{- printf "%s-content-data" (include "bottle-filling-twin.fullname" .) }}
{{- end }}
{{- end }}

{{- define "bottle-filling-twin.pvc.shaderCache" -}}
{{- if .Values.storage.shaderCache.existingClaim }}
{{- .Values.storage.shaderCache.existingClaim }}
{{- else if .Values.streamingKit.sessionId }}
{{- printf "%s-shader-cache" .Values.streamingKit.sessionId }}
{{- else }}
{{- printf "%s-shader-cache" (include "bottle-filling-twin.fullname" .) }}
{{- end }}
{{- end }}

{{- define "bottle-filling-twin.pvc.extensionCache" -}}
{{- if .Values.storage.extensionCache.existingClaim }}
{{- .Values.storage.extensionCache.existingClaim }}
{{- else if .Values.streamingKit.userId }}
{{- printf "%s-extension-cache" .Values.streamingKit.userId }}
{{- else if .Values.streamingKit.sessionId }}
{{- printf "%s-extension-cache" .Values.streamingKit.sessionId }}
{{- else }}
{{- printf "%s-extension-cache" (include "bottle-filling-twin.fullname" .) }}
{{- end }}
{{- end }}

{{- define "bottle-filling-twin.pvc.omniverseCache" -}}
{{- if .Values.storage.omniverseCache.existingClaim }}
{{- .Values.storage.omniverseCache.existingClaim }}
{{- else if .Values.streamingKit.sessionId }}
{{- printf "%s-omniverse-cache" (include "bottle-filling-twin.fullname" .) }}
{{- else }}
{{- printf "%s-omniverse-cache" (include "bottle-filling-twin.fullname" .) }}
{{- end }}
{{- end }}

{{/*
GPU environment variables
*/}}
{{- define "bottle-filling-twin.gpuEnv" -}}
- name: NVIDIA_VISIBLE_DEVICES
  value: {{ .Values.gpu.visibleDevices | quote }}
- name: NVIDIA_DRIVER_CAPABILITIES
  value: {{ .Values.gpu.driverCapabilities | quote }}
{{- end }}

{{/*
Image pull secrets
*/}}
{{- define "bottle-filling-twin.imagePullSecrets" -}}
{{- if .Values.imagePullSecrets }}
{{- range .Values.imagePullSecrets }}
- name: {{ .name }}
{{- end }}
{{- end }}
{{- end }}

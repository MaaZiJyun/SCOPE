from pydantic import Field
from typing import Optional
from app.models.api_dict.basic import CamelModel

class HardwareDict(CamelModel):
    id: str
    project_id: str = Field(..., alias="projectId")
    
    # Imagery
    focal_length_mm: Optional[float] = Field(None, alias="focalLength")
    width_px: Optional[int] = Field(None, alias="widthPx")
    length_px: Optional[int] = Field(None, alias="lengthPx")
    px_size_width: Optional[float] = Field(None, alias="pxSizeWidth")
    px_size_length: Optional[float] = Field(None, alias="pxSizeLength")
    channels_per_pixel: Optional[int] = Field(None, alias="channelsPerPx")
    bits_per_channel: Optional[int] = Field(None, alias="bitsPerChannel")

    # Network
    downlink_frequency_hz: Optional[float] = Field(None, alias="downlinkFrequencyHz")
    downlink_bandwidth_hz: Optional[float] = Field(None, alias="downlinkBandwidthHz")
    downlink_tx_power_w: Optional[float] = Field(None, alias="downlinkTxPowerW")
    downlink_gain_tx_dbi: Optional[float] = Field(None, alias="downlinkGainTxDbi")
    downlink_gain_rx_dbi: Optional[float] = Field(None, alias="downlinkGainRxDbi")
    downlink_noise_temp_k: Optional[float] = Field(None, alias="downlinkNoiseTempK")

    uplink_frequency_hz: Optional[float] = Field(None, alias="uplinkFrequencyHz")
    uplink_bandwidth_hz: Optional[float] = Field(None, alias="uplinkBandwidthHz")
    uplink_gain_tx_dbi: Optional[float] = Field(None, alias="uplinkGainTxDbi")
    uplink_tx_power_w: Optional[float] = Field(None, alias="uplinkTxPowerW")
    uplink_gain_rx_dbi: Optional[float] = Field(None, alias="uplinkGainRxDbi")
    uplink_noise_temp_k: Optional[float] = Field(None, alias="uplinkNoiseTempK")

    isl_frequency_hz: Optional[float] = Field(None, alias="islFrequencyHz")
    isl_bandwidth_hz: Optional[float] = Field(None, alias="islBandwidthHz")
    isl_tx_power_w: Optional[float] = Field(None, alias="islTxPowerW")
    isl_gain_tx_dbi: Optional[float] = Field(None, alias="islGainTxDbi")
    isl_gain_rx_dbi: Optional[float] = Field(None, alias="islGainRxDbi")
    isl_noise_temp_k: Optional[float] = Field(None, alias="islNoiseTempK")
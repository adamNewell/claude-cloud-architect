from awsiot.greengrasscoreipc.clientv2 import GreengrassCoreIPCClientV2
from awsiot.greengrasscoreipc.model import (
    SubscribeToTopicRequest,
    PublishToTopicRequest,
    GetConfigurationRequest,
    GetThingShadowRequest,
    UpdateThingShadowRequest,
    SubscribeToIoTCoreRequest,
    PublishToIoTCoreRequest,
)

# Should match: ggv2-ipc-client-python
ipc_client = GreengrassCoreIPCClientV2()

# Should match: ggv2-ipc-pubsub
ipc_client.subscribe_to_topic(topic="local/sensor/data", on_stream_event=handler)
ipc_client.publish_to_topic(topic="local/processed/data", publish_message=payload)

# Should match: ggv2-ipc-config
config = ipc_client.get_configuration(key_path=["sampleConfig"])

# Should match: ggv2-ipc-shadow
shadow = ipc_client.get_thing_shadow(thing_name="my-device", shadow_name="reported")
ipc_client.update_thing_shadow(thing_name="my-device", shadow_name="reported", payload=b"{}")

# Should match: ggv2-ipc-iotcore
ipc_client.subscribe_to_iot_core(topic_name="cloud/commands", qos=0, on_stream_event=handler)
ipc_client.publish_to_iot_core(topic_name="cloud/telemetry", qos=0, payload=b"{}")

# Should match: ggv2-v1-sdk-antipattern (DEBT)
import aws_greengrass_core_sdk

from sagemaker_inference.default_handler_service import DefaultHandlerService
from sagemaker_inference.transformer import Transformer
from .inference import SRLInferenceHandler
from sagemaker_inference import model_server


class SRLHandlerService(DefaultHandlerService):
    """Handler service that is executed by the model server.
    Determines specific default inference handlers to use based on model being used.
    This class extends ``DefaultHandlerService``, which define the following:
        - The ``handle`` method is invoked for all incoming inference requests to the model server.
        - The ``initialize`` method is invoked at model server start up.
    Based on: https://github.com/awslabs/multi-model-server/blob/master/docs/custom_service.md
    """
    def __init__(self):
        transformer = Transformer(default_inference_handler=SRLInferenceHandler())
        super(SRLHandlerService, self).__init__(transformer=transformer)


HANDLER_SERVICE = SRLHandlerService.__name__

model_server.start_model_server(handler_service=HANDLER_SERVICE)
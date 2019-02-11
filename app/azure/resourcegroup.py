import json

from azure.common.client_factory import get_client_from_cli_profile
from azure.mgmt.resource import ResourceManagementClient
from azure.mgmt.resource.resources.models import DeploymentMode


class ResourceGroup(object):

    def __init__(self, resource_group, region=None):
        self.resource_group = resource_group
        self.region = region
        self.client = get_client_from_cli_profile(ResourceManagementClient)

    def create(self):
        self.client.resource_groups.create_or_update(
            self.resource_group,
            {
                'location': self.region
            }
        )

    def deploy_template(self, template, parameters):
        template = json.loads(template)

        parameters = {k: {'value': v} for k, v in parameters.items()}

        deployment_properties = {
            'mode': DeploymentMode.incremental,
            'template': template,
            'parameters': parameters
        }

        deployment_async_operation = self.client.deployments.create_or_update(
            self.resource_group,
            self.resource_group,
            deployment_properties
        )
        # deployment_async_operation.wait()

    def destroy(self):
        self.client.resource_groups.delete(self.resource_group)

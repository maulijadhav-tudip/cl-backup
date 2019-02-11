import uuid

from azure.common.client_factory import get_client_from_cli_profile
from azure.graphrbac import GraphRbacManagementClient
from azure.graphrbac.models import UserCreateParameters, PasswordProfile
from azure.mgmt.authorization import AuthorizationManagementClient
from azure.mgmt.authorization.models import RoleAssignmentCreateParameters

class User(object):

    def __init__(self, user_principal_name, subscription_id, display_name=None, mail_nickname=None, password=None, verify=False):
        self.user_principal_name = user_principal_name
        self.subscription_id = subscription_id
        self.display_name = display_name
        self.mail_nickname = mail_nickname
        self.password = password
        self.user = {}
        self.roleAssignment = {}
        self.verify = verify
        self.client = get_client_from_cli_profile(GraphRbacManagementClient)

        self.authClient = get_client_from_cli_profile(AuthorizationManagementClient,
                                                      subscription_id=self.subscription_id)

    def create(self):
        self.user = self.client.users.create(
            UserCreateParameters(
                user_principal_name=self.user_principal_name,
                account_enabled=True,
                display_name=self.display_name,
                mail_nickname=self.mail_nickname,
                password_profile=PasswordProfile(
                    password=self.password,
                    force_change_password_next_login=False
                )
            ),
            verify=self.verify
        )

    def assign_resource_group(self, resource_group):
        scope = '/subscriptions/' + self.subscription_id + \
            '/resourceGroups/' + resource_group
        assignment_name = uuid.uuid4()
        role = "/subscriptions/" + self.subscription_id + \
               "/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c"

        parameters = RoleAssignmentCreateParameters(
            role_definition_id=role,
            principal_id=self.user.object_id)

        self.roleAssignment = self.authClient.role_assignments.create(
            scope=scope,
            role_assignment_name=assignment_name,
            parameters=parameters)

    def destroy(self):
        self.client.users.delete(self.user_principal_name,verify=self.verify)

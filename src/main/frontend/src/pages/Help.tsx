import Card from "../components/General/Card";
import BreadCrumbs from "../layouts/Breadcrumbs";
import IGTLogo from "../assets/images/igtlogo.png";
import Github from "../assets/images/github.png";

const Help = () => {
  return (
    <>
      <BreadCrumbs
        path={[
          { name: "Home", link: "/" },
          { name: "Help", link: "/help" },
        ]}
        backLink="/"
      />

      <div className="container mx-auto">
        <h1 className="text-title dark:text-white mb-10">Help</h1>

        <div className="text-small md:text-redactor">
          <Card>
            <div className="mb-8">
              <img src={IGTLogo} className=" h-24 md:h-40 sm:h-32" />
            </div>
            <div className="md:px-7 sm:px-5">
              <h2 className=" text-title mb-4">
                Welcome to WebMethods UI Help page
              </h2>
              <div className="mb-20 flex flex-col gap-10">
                <div>
                  Messaging Hub is a communication and integration tool
                  developed by IGT Consulting s.r.o. to assist IBM webMethods
                  users in managing messaging systems more effectively. Built to
                  run on IBM webMethods Integration Server and integrated with
                  Universal Messaging (UM), Messaging Hub also supports other
                  JMS systems like Apache Kafka.
                </div>
                <div>
                  The platform simplifies and streamlines tasks such as
                  configuring connections, managing topics, and creating
                  interfaces for seamless message delivery, helping IBM
                  webMethods users optimize their workflow and reduce manual
                  effort.
                </div>
                <div>
                  If you encounter any issues, need assistance, or have
                  questions about Messaging Hub, please feel free to contact our
                  team <a
                    href="mailto:support@igtconsulting.eu"
                    className="text-blue font-semibold"
                  >
                    support@igtconsulting.eu
                  </a>
                </div>
                <div>
                  For source code access, bug reporting, or contributing to
                  development, visit our <a
                    href="https://github.com/igtconsulting/messaging-hub"
                    target="_blank"
                    className="text-blue font-semibold"
                  >
                    Github repository
                  </a>
                  
                </div>
                <div>
                  At IGT Consulting s.r.o., we are dedicated to supporting the
                  IBM webMethods with solutions like Messaging Hub to
                  make their work more efficient and productive.
                </div>
              </div>

              <div className="mb-32">
                More about us{" "}
                <a
                  href="https://www.igtconsulting.eu/"
                  target="_blank"
                  className="text-blue font-semibold"
                >
                  https://www.igtconsulting.eu/
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Help;
